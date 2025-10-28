import * as client from 'prom-client';
import { createServer } from 'http';

client.collectDefaultMetrics();

export function startMetricsServer(port: number = 9100) {
  const server = createServer(async (req, res) => {
    if (req.url === '/metrics') {
      try {
        const metrics = await client.register.metrics();
        res.writeHead(200, { 'Content-Type': client.register.contentType });
        res.end(metrics);
      } catch (err) {
        res.writeHead(500);
        res.end('Error collecting metrics');
      }
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Metrics server listening on http://localhost:${port}/metrics`);
  });

  return server;
}

export const promClient = client;

// Common metrics used across services
// Lazy getters so metrics are only registered when a service uses them.
let _ordersCreatedCounter: client.Counter<string> | undefined;
export function getOrdersCreatedCounter() {
  if (!_ordersCreatedCounter) {
    _ordersCreatedCounter = new client.Counter({
      name: 'orders_created_total',
      help: 'Total number of orders created'
    });
  }
  return _ordersCreatedCounter;
}

let _paymentsProcessedCounter: client.Counter<string> | undefined;
export function getPaymentsProcessedCounter() {
  if (!_paymentsProcessedCounter) {
    _paymentsProcessedCounter = new client.Counter({
      name: 'payments_processed_total',
      help: 'Total number of successfully processed payments'
    });
  }
  return _paymentsProcessedCounter;
}

let _paymentsFailedCounter: client.Counter<string> | undefined;
export function getPaymentsFailedCounter() {
  if (!_paymentsFailedCounter) {
    _paymentsFailedCounter = new client.Counter({
      name: 'payments_failed_total',
      help: 'Total number of failed payments'
    });
  }
  return _paymentsFailedCounter;
}

let _paymentProcessingHistogram: client.Histogram<string> | undefined;
export function getPaymentProcessingHistogram() {
  if (!_paymentProcessingHistogram) {
    _paymentProcessingHistogram = new client.Histogram({
      name: 'payment_processing_seconds',
      help: 'Histogram of payment processing time in seconds',
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    });
  }
  return _paymentProcessingHistogram;
}

let _notificationsCounter: client.Counter<string> | undefined;
export function getNotificationsCounter() {
  if (!_notificationsCounter) {
    _notificationsCounter = new client.Counter({
      name: 'notifications_sent_total',
      help: 'Total number of notifications handled'
    });
  }
  return _notificationsCounter;
}
