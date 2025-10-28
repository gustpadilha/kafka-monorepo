import { Injectable, Logger } from '@nestjs/common';
import { Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { getNotificationsCounter } from '@kafka/metrics';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  handleOrderCreated(@Payload() message: any, @Ctx() context: KafkaContext) {
    const order = message.value || message;
    this.logger.log(`[Notifications] Order created: ${order?.id}`);
  try { getNotificationsCounter().inc(); } catch (err) { this.logger.warn('Failed to increment notifications counter', err as any); }
  }

  handlePaymentProcessed(@Payload() message: any, @Ctx() context: KafkaContext) {
    const evt = message.value || message;
    this.logger.log(`[Notifications] Payment processed: ${evt?.orderId}`);
  try { getNotificationsCounter().inc(); } catch (err) { this.logger.warn('Failed to increment notifications counter', err as any); }
  }

  handlePaymentFailed(@Payload() message: any, @Ctx() context: KafkaContext) {
    const evt = message.value || message;
    this.logger.warn(`[Notifications] Payment failed: ${evt?.orderId}`);
  try { getNotificationsCounter().inc(); } catch (err) { this.logger.warn('Failed to increment notifications counter', err as any); }
  }
}
