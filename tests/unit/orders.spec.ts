import { OrdersController } from '../../services/orders/src/orders.controller';

class FakeClient {
  public emits: Array<{ topic: string; message: any }> = [];
  async connect() {}
  emit(topic: string, message: any) {
    this.emits.push({ topic, message });
  }
}

describe('OrdersController (unit)', () => {
  it('should create order and emit order.created', async () => {
    const fake = new FakeClient();
    const ctrl = new OrdersController(fake as any);

    const resp = await ctrl.create({ amount: 5, items: [] });
    expect(resp).toHaveProperty('status', 'queued');
    expect(resp).toHaveProperty('order');
    expect(fake.emits.length).toBeGreaterThanOrEqual(1);
    expect(fake.emits[0].topic).toBe('order.created');
  });
});
