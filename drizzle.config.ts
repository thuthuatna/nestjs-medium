import { defineConfig } from 'drizzle-kit';
import { ConfigService } from '@nestjs/config';
import 'dotenv/config';

const configService = new ConfigService();
const configPath = process.env.DRIZZLE_CONFIG_PATH || './drizzle';

export default defineConfig({
  schema: './src/database/entities/*.ts',
  out: configPath,
  dialect: 'postgresql',
  dbCredentials: {
    host: configService.get<string>('POSTGRES_HOST') || '',
    port: configService.get<number>('POSTGRES_PORT') || 5432,
    user: configService.get<string>('POSTGRES_USER') || '',
    password: configService.get<string>('POSTGRES_PASSWORD') || '',
    database: configService.get<string>('POSTGRES_DB') || '',
    ssl: false, // Changed to false to fix SSL connection issues
  },
  migrations: {
    table: 'migrations',
    schema: 'public',
  },
});
