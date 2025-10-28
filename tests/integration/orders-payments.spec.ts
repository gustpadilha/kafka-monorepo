import { Test } from '@nestjs/testing';
import { OrdersController } from '../../services/orders/src/orders.controller';
import { PaymentsService } from '../../services/payments/src/payments.service';
import { NotificationsService } from '../../services/notifications/src/notifications.service';

// A minimal fake Kafka client that records emits
class FakeKafkaClient {
  public emits: Array<{ topic: string; message: any }> = [];
  async connect() {}
  emit(topic: string, message: any) {
    this.emits.push({ topic, message });
  }
}

describe('Orders -> Payments integration (simulated)', () => {
  let fakeClient: FakeKafkaClient;
  let ordersController: OrdersController;
  let paymentsService: PaymentsService;
  let notificationsService: NotificationsService;

  beforeAll(async () => {
    fakeClient = new FakeKafkaClient();

    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        PaymentsService,
        NotificationsService,
        // provide the KAFKA_SERVICE token used in services
        { provide: 'KAFKA_SERVICE', useValue: fakeClient }
      ]
    }).compile();

    ordersController = moduleRef.get(OrdersController);
    paymentsService = moduleRef.get(PaymentsService);
    notificationsService = moduleRef.get(NotificationsService);
  });

  it('OrdersController should emit order.created and PaymentsService should emit payment.*', async () => {
    // create an order via controller
    const resp = await ordersController.create({ amount: 123.45, items: [] });
    expect(resp).toHaveProperty('status', 'queued');
    expect(resp).toHaveProperty('order');

    // OrdersController should have used the fake client to emit order.created
    expect(fakeClient.emits.length).toBeGreaterThanOrEqual(1);
    const first = fakeClient.emits[0];
    expect(first.topic).toBe('order.created');
    const emittedOrder = first.message || first;

  // Simulate delivery of order.created to NotificationsService
  const spyOrder = jest.spyOn(notificationsService, 'handleOrderCreated');
  await notificationsService.handleOrderCreated({ value: emittedOrder } as any, {} as any);
  expect(spyOrder).toHaveBeenCalled();

    // Now simulate Kafka delivering this event to PaymentsService by calling its handler
    // The PaymentsService handler expects a message with a `value` property or the object itself
    await paymentsService.handleOrderCreated({ value: emittedOrder } as any, {} as any);

    // After handling, PaymentsService should have emitted a payment.* event
    const paymentEmits = fakeClient.emits.filter(e => e.topic.startsWith('payment.'));
    expect(paymentEmits.length).toBeGreaterThanOrEqual(1);
    const paymentTopic = paymentEmits[0].topic;
    expect(['payment.processed', 'payment.failed']).toContain(paymentTopic);

    const payload = paymentEmits[0].message;
    expect(payload).toHaveProperty('orderId');
    expect(payload).toHaveProperty('status');

    // Simulate delivery of payment.* to NotificationsService and assert handlers called
    const spyProcessed = jest.spyOn(notificationsService, 'handlePaymentProcessed');
    const spyFailed = jest.spyOn(notificationsService, 'handlePaymentFailed');
    if (paymentTopic === 'payment.processed') {
      await notificationsService.handlePaymentProcessed({ value: payload } as any, {} as any);
      expect(spyProcessed).toHaveBeenCalled();
    } else {
      await notificationsService.handlePaymentFailed({ value: payload } as any, {} as any);
      expect(spyFailed).toHaveBeenCalled();
    }
  });
});
