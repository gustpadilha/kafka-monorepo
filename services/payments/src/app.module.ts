import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: { brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',') },
          consumer: { groupId: process.env.PAYMENTS_CLIENT_GROUP || 'payments-client-replies' }
        }
      }
    ])
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService]
})
export class AppModule {}
