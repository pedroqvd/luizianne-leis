import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl = Number(process.env.CACHE_TTL_SECONDS ?? 300);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttl = this.defaultTtl): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async wrap<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await fn();
    await this.set(key, value, ttl);
    return value;
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
