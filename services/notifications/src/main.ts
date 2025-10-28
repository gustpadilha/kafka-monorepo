import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { startMetricsServer } from '@kafka/metrics';
import { WinstonLogger } from '@kafka/logger';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: { brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',') },
      consumer: { groupId: process.env.NOTIFICATIONS_CONSUMER_GROUP || 'notifications-consumer' }
    }
  });

  app.useLogger(new WinstonLogger());

  await app.listen();
  console.log('Notifications service listening (Kafka consumer)');
  startMetricsServer(9103);
}
bootstrap();
