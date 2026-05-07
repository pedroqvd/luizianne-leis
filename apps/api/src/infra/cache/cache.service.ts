import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

// FIX #8: Sentinel value para distinguir "não cacheado" de "valor é null"
const NULL_SENTINEL = '__NULL__';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl = Number(process.env.CACHE_TTL_SECONDS ?? 300);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<{ found: boolean; value: T | null }> {
    const raw = await this.redis.get(key);
    if (raw === null) return { found: false, value: null };
    if (raw === NULL_SENTINEL) return { found: true, value: null };
    try {
      return { found: true, value: JSON.parse(raw) as T };
    } catch {
      return { found: false, value: null };
    }
  }

  async set(key: string, value: unknown, ttl = this.defaultTtl): Promise<void> {
    const serialized = value === null || value === undefined ? NULL_SENTINEL : JSON.stringify(value);
    await this.redis.set(key, serialized, 'EX', ttl);
  }

  /**
   * FIX #8 (ALTO): wrap() agora cacheia corretamente valores null usando sentinel.
   * Antes, null nunca era cacheado — causando thundering herd em endpoints com retorno null.
   */
  async wrap<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const { found, value } = await this.get<T>(key);
    if (found) return value as T;
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  async invalidate(pattern: string): Promise<void> {
    const stream = this.redis.scanStream({ match: pattern, count: 100 });
    const pipeline = this.redis.pipeline();
    let count = 0;
    for await (const keys of stream) {
      for (const key of keys as string[]) {
        pipeline.del(key);
        count++;
      }
    }
    if (count > 0) await pipeline.exec();
    this.logger.debug(`invalidated ${count} keys for pattern=${pattern}`);
  }
}
