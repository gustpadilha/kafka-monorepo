import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { WinstonLogger } from '@kafka/logger';
import { startMetricsServer } from '@kafka/metrics';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
      },
      consumer: {
        groupId: process.env.PAYMENTS_CONSUMER_GROUP || 'payments-consumer'
      }
    }
  });

  app.useLogger(new WinstonLogger());

  await app.listen();
  console.log('Payments service listening (Kafka consumer)');
  startMetricsServer(9102);
}
bootstrap();
