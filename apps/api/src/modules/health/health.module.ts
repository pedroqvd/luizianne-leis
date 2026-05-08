import { Controller, Get, Inject, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { PG_POOL } from '../../infra/database/database.module';
import { REDIS_CLIENT } from '../../infra/redis/redis.module';
import { Public } from '../../infra/auth';

@Public()
@Controller('health')
class HealthController {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {}

  @Get()
  async check() {
    const db = await this.pool.query('SELECT 1')
      .then(() => 'ok')
      .catch((e: Error) => e.message);

    let cache = 'disabled';
    if (this.redis) {
      cache = await this.redis.ping()
        .then((r) => (r === 'PONG' ? 'ok' : r))
        .catch((e: Error) => e.message);
    }

    // Render health check: return 200 as long as DB is ok.
    // Redis being down should NOT make the health check fail.
    const healthy = db === 'ok';
    return {
      status: healthy ? 'ok' : 'degraded',
      service: 'luizianne-api',
      ts: new Date().toISOString(),
      checks: { db, cache },
    };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
