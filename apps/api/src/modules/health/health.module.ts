import { Controller, Get, Inject, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { PG_POOL } from '../../infra/database/database.module';
import { REDIS_CLIENT } from '../../infra/redis/redis.module';
import { Public } from '../../infra/auth';

// FIX #2: Health endpoint marcado como @Public() — deve ser acessível sem JWT
@Public()
@Controller('health')
class HealthController {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    const [db, cache] = await Promise.all([
      this.pool.query('SELECT 1').then(() => 'ok').catch((e: Error) => e.message),
      this.redis.ping().then((r) => (r === 'PONG' ? 'ok' : r)).catch((e: Error) => e.message),
    ]);

    const healthy = db === 'ok' && cache === 'ok';
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
