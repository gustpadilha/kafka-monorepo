import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('order.created')
  handleOrderCreated(@Payload() message: any, @Ctx() context: KafkaContext) {
    return this.notificationsService.handleOrderCreated(message, context);
  }

  @EventPattern('payment.processed')
  handlePaymentProcessed(@Payload() message: any, @Ctx() context: KafkaContext) {
    return this.notificationsService.handlePaymentProcessed(message, context);
  }

  @EventPattern('payment.failed')
  handlePaymentFailed(@Payload() message: any, @Ctx() context: KafkaContext) {
    return this.notificationsService.handlePaymentFailed(message, context);
  }
}
