import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTokenPrefixMiddleware } from './common/middlewares/swagger-token-prefix.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.use(helmet());

  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 4000;

  app.use(new SwaggerTokenPrefixMiddleware().use);
  const config = new DocumentBuilder()
    .setTitle('Medium')
    .setDescription('The medium API description')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'Authorization', // <- header key name
        in: 'header',
        description: 'Enter token as: token <your-token>',
      },
      'token', // <- security name used in @ApiSecurity()
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory, {
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
      persistAuthorization: true,
    },
  });

  await app.listen(port);
}
bootstrap();
