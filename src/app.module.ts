import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().default(5432),
        POSTGRES_DB: Joi.string().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_MAX_CONNECTIONS: Joi.number().default(20),
        POSTGRES_IDLE_TIMEOUT: Joi.number().default(30000),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('1h'),
      }),
      isGlobal: true,
      cache: true,
    }),
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        host: configService.get<string>('POSTGRES_HOST', 'localhost'),
        port: configService.get<number>('POSTGRES_PORT', 5432),
        user: configService.get<string>('POSTGRES_USER', 'user'),
        password: configService.get<string>('POSTGRES_PASSWORD', 'password'),
        database: configService.get<string>('POSTGRES_DB', 'database'),
        max: configService.get<number>('POSTGRES_MAX_CONNECTIONS', 20),
        idleTimeoutMillis: configService.get<number>(
          'POSTGRES_IDLE_TIMEOUT',
          30000,
        ),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
