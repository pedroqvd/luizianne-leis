import { Controller, Get, Inject, Logger, Module, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { PG_POOL } from '../../infra/database/database.module';
import { REDIS_CLIENT } from '../../infra/redis/redis.module';
import { Public } from '../../infra/auth';

@Public()
@Controller('health')
class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {}

  @Get()
  async check() {
    const db = await this.pool
      .query('SELECT 1')
      .then(() => 'ok')
      .catch((e: Error) => {
        this.logger.error(`Database healthcheck failed: ${e.message}`);
        return 'error';
      });

    let cache = 'disabled';
    if (this.redis) {
      cache = await this.redis
        .ping()
        .then((r) => (r === 'PONG' ? 'ok' : 'degraded'))
        .catch((e: Error) => {
          this.logger.warn(`Redis healthcheck failed: ${e.message}`);
          return 'error';
        });
    }

    const healthy = db === 'ok';
    const payload = {
      status: healthy ? 'ok' : 'degraded',
      service: 'luizianne-api',
      ts: new Date().toISOString(),
      checks: { db, cache },
    };

    if (!healthy) {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
