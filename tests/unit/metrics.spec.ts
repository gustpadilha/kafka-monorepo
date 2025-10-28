import { getOrdersCreatedCounter, getPaymentsFailedCounter, getNotificationsCounter } from '@kafka/metrics';

describe('metrics getters', () => {
  it('should return counters and allow increment', () => {
    const orders = getOrdersCreatedCounter();
    expect(orders).toHaveProperty('inc');
    orders.inc();

    const paymentsFailed = getPaymentsFailedCounter();
    expect(paymentsFailed).toHaveProperty('inc');
    paymentsFailed.inc();

    const notifications = getNotificationsCounter();
    expect(notifications).toHaveProperty('inc');
    notifications.inc();
  });

  it('startMetricsServer should expose /metrics', async () => {
    // start server on an ephemeral port
    const { startMetricsServer } = await import('@kafka/metrics');
    const server = startMetricsServer(0);

    // get the actual port the server is listening on
    const addr: any = server.address();
    const port = addr && addr.port ? addr.port : 9100;

    const resBody = await new Promise<string>((resolve, reject) => {
      const http = require('http');
      http.get({ hostname: '127.0.0.1', port, path: '/metrics' }, (res: any) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', (err: any) => reject(err));
      }).on('error', (err: any) => reject(err));
    });

    expect(resBody).toMatch(/# HELP|# TYPE|process_cpu_user_seconds_total/);
    server.close();
  });
});
