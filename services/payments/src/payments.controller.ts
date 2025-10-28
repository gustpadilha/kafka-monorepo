import { Controller, Inject, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() message: any, @Ctx() context: KafkaContext) {
    try {
      // delegate to service to keep business logic there
      await this.paymentsService.handleOrderCreated(message, context);
    } catch (err) {
      this.logger.error('Error handling order.created', err as any);
    }
  }
}
