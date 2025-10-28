import { NotificationsService } from '../../services/notifications/src/notifications.service';

describe('NotificationsService (unit)', () => {
  let svc: NotificationsService;

  beforeEach(() => {
    svc = new NotificationsService();
  });

  it('should handle order created', async () => {
    await svc.handleOrderCreated({ value: { id: 1 } } as any, {} as any);
  });

  it('should handle payment processed', async () => {
    await svc.handlePaymentProcessed({ value: { orderId: 1 } } as any, {} as any);
  });

  it('should handle payment failed', async () => {
    await svc.handlePaymentFailed({ value: { orderId: 1 } } as any, {} as any);
  });
});
