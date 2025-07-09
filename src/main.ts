import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 4000;
  const host = configService.get<string>('POSTGRES_HOST');
  console.log(`Database host: ${host}`);

  await app.listen(port);
}
bootstrap();
