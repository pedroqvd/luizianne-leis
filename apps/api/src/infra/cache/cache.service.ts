import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

const NULL_SENTINEL = '__NULL__';

/**
 * Cache service with graceful Redis fallback.
 * When Redis is unavailable, uses an in-memory Map with TTL expiration.
 * This ensures the app works even without Redis (just no distributed cache).
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl = Number(process.env.CACHE_TTL_SECONDS ?? 300);

  // In-memory fallback when Redis is not available
  private readonly memCache = new Map<string, { value: string; expiresAt: number }>();

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {
    if (!redis) {
      this.logger.warn('Redis not available — using in-memory cache fallback');
    }
  }

  private get redisReady(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  async get<T>(key: string): Promise<{ found: boolean; value: T | null }> {
    if (this.redisReady) {
      try {
        const raw = await this.redis!.get(key);
        if (raw === null) return { found: false, value: null };
        if (raw === NULL_SENTINEL) return { found: true, value: null };
        try {
          return { found: true, value: JSON.parse(raw) as T };
        } catch {
          return { found: false, value: null };
        }
      } catch {
        // Redis error — fallthrough to memory
      }
    }

    // In-memory fallback
    const entry = this.memCache.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      if (entry) this.memCache.delete(key);
      return { found: false, value: null };
    }
    if (entry.value === NULL_SENTINEL) return { found: true, value: null };
    try {
      return { found: true, value: JSON.parse(entry.value) as T };
    } catch {
      return { found: false, value: null };
    }
  }

  async set(key: string, value: unknown, ttl = this.defaultTtl): Promise<void> {
    const serialized = value === null || value === undefined ? NULL_SENTINEL : JSON.stringify(value);

    if (this.redisReady) {
      try {
        await this.redis!.set(key, serialized, 'EX', ttl);
        return;
      } catch {
        // Redis error — fallthrough to memory
      }
    }

    // In-memory fallback
    this.memCache.set(key, { value: serialized, expiresAt: Date.now() + ttl * 1000 });
  }

  async wrap<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const { found, value } = await this.get<T>(key);
    if (found) return value as T;
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  async invalidate(pattern: string): Promise<void> {
    if (this.redisReady) {
      try {
        const stream = this.redis!.scanStream({ match: pattern, count: 100 });
        const pipeline = this.redis!.pipeline();
        let count = 0;
        for await (const keys of stream) {
          for (const key of keys as string[]) {
            pipeline.del(key);
            count++;
          }
        }
        if (count > 0) await pipeline.exec();
        this.logger.debug(`invalidated ${count} keys for pattern=${pattern}`);
        return;
      } catch {
        // Redis error — fallthrough
      }
    }

    // In-memory fallback: match by prefix (convert glob to prefix)
    const prefix = pattern.replace(/\*.*$/, '');
    let count = 0;
    for (const key of this.memCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memCache.delete(key);
        count++;
      }
    }
    if (count > 0) this.logger.debug(`invalidated ${count} mem-cache keys for pattern=${pattern}`);
  }
}
