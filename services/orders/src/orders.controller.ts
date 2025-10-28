import { Controller, Post, Body, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { getOrdersCreatedCounter } from '@kafka/metrics';

@Controller('orders')
export class OrdersController implements OnModuleInit {
  private readonly logger = new Logger(OrdersController.name);

  constructor(@Inject('KAFKA_SERVICE') private readonly client: ClientKafka) { }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Kafka client connected');
    } catch (err) {
      this.logger.warn('Orders: failed to connect Kafka client', err as any);
    }
  }

  @Post()
  async create(@Body() payload: any) {
    const order = {
      id: Date.now(),
      amount: payload.amount || 0,
      items: payload.items || [],
      createdAt: new Date().toISOString()
    };

    // emit an event to Kafka
    this.logger.log(`Creating order ${order.id} amount=${order.amount}`);
    this.client.emit('order.created', order);
    this.logger.log(`Orders: emitted order.created ${order.id}`);
    try {
      getOrdersCreatedCounter().inc();
    } catch (err) {
      this.logger.warn('Failed to increment orders counter', err as any);
    }

    return { status: 'queued', order };
  }
}
