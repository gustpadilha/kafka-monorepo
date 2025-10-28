import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { Payload, Ctx, KafkaContext, ClientKafka } from '@nestjs/microservices';
import { getPaymentsProcessedCounter, getPaymentsFailedCounter, getPaymentProcessingHistogram } from '@kafka/metrics';

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(@Inject('KAFKA_SERVICE') private readonly client: ClientKafka) { }

  async onModuleInit() {
    // ensure producer is connected
    try {
      await this.client.connect();
      this.logger.log('Kafka client connected');
    } catch (err) {
      this.logger.warn('Payments: failed to connect Kafka client', err as any);
    }
  }

  async handleOrderCreated(@Payload() message: any, @Ctx() context: KafkaContext) {
    const order = message.value || message;
    this.logger.log(`Payments: received order ${order?.id}`);

  const end = getPaymentProcessingHistogram().startTimer();
    const success = Math.random() > 0.2;
    const event = {
      orderId: order.id,
      status: success ? 'processed' : 'failed',
      transactionId: success ? `txn_${Date.now()}` : undefined,
      processedAt: new Date().toISOString()
    };

    const topic = event.status === 'processed' ? 'payment.processed' : 'payment.failed';

    try {
      this.client.emit(topic, event);
      this.logger.log(`Payments: emitted ${topic} ${JSON.stringify(event)}`);
      if (success) getPaymentsProcessedCounter().inc();
      else getPaymentsFailedCounter().inc();
    } catch (err) {
      this.logger.error('Payments: failed to emit event', err as any);
      try { getPaymentsFailedCounter().inc(); } catch (_) { /* ignore */ }
    } finally {
      try { end(); } catch (err) { this.logger.warn('Failed to stop payment processing timer', err as any); }
    }
  }
}
