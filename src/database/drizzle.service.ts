import { Inject, Injectable, Logger } from '@nestjs/common';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { CONNECTION_POOL } from './database.module-definition';
import { schema } from './schema';

@Injectable()
export class DrizzleService {
  private readonly logger = new Logger(DrizzleService.name);
  public db: NodePgDatabase<typeof schema>;
  constructor(@Inject(CONNECTION_POOL) private readonly pool: Pool) {
    this.db = drizzle(this.pool, { schema: schema });
    this.checkPoolStatus();
  }

  private async checkPoolStatus(): Promise<void> {
    try {
      await this.pool.query('SELECT 1');
      this.logger.log('✅ Connection pool is healthy');
    } catch (error) {
      console.error('❌ Connection pool check failed:', error.message);
      throw new Error('Connection pool check failed');
    }
  }
}
