import { PaymentsService } from '../../services/payments/src/payments.service';

class FakeClient {
  public emits: Array<{ topic: string; message: any }> = [];
  async connect() {}
  emit(topic: string, message: any) {
    this.emits.push({ topic, message });
  }
}

describe('PaymentsService (unit)', () => {
  let fake: FakeClient;
  let svc: PaymentsService;

  beforeEach(() => {
    fake = new FakeClient();
    svc = new PaymentsService(fake as any);
  });

  it('should emit payment.processed when random indicates success', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    await svc.handleOrderCreated({ value: { id: 1 } } as any, {} as any);
    const emits = fake.emits.filter(e => e.topic.startsWith('payment.'));
    expect(emits.length).toBeGreaterThanOrEqual(1);
    expect(emits[0].topic).toBe('payment.processed');
    (Math.random as jest.MockedFunction<any>).mockRestore();
  });

  it('should emit payment.failed when random indicates failure', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.0);
    await svc.handleOrderCreated({ value: { id: 2 } } as any, {} as any);
    const emits = fake.emits.filter(e => e.topic.startsWith('payment.'));
    expect(emits.length).toBeGreaterThanOrEqual(1);
    expect(emits[0].topic).toBe('payment.failed');
    (Math.random as jest.MockedFunction<any>).mockRestore();
  });
});
