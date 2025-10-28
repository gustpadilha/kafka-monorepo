import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { startMetricsServer } from '@kafka/metrics';
import { WinstonLogger } from '@kafka/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(new WinstonLogger());
  app.enableCors();
  await app.listen(3001);
  console.log('Orders service listening on http://localhost:3001');
  startMetricsServer(9101);
}
bootstrap();
