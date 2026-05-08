import { Global, Module, Logger } from '@nestjs/common';
import IORedis, { Redis, RedisOptions } from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * Redis connection with graceful fallback.
 * If REDIS_URL is not set or connection fails, returns null.
 * All consumers MUST handle null Redis gracefully.
 */
function buildClient(): Redis | null {
  const url = process.env.REDIS_URL;
  const logger = new Logger('RedisModule');

  if (!url) {
    logger.warn('REDIS_URL not set — Redis disabled (cache/queue will use in-memory fallback)');
    return null;
  }

  const isTls = url.startsWith('rediss://');
  const opts: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true, // Don't connect immediately — we'll do it manually
    retryStrategy(times) {
      if (times > 3) {
        logger.error('Redis connection failed after 3 retries — disabling Redis');
        return null; // Stop retrying
      }
      return Math.min(times * 500, 3000);
    },
  };
  if (isTls) {
    opts.tls = {
      rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
    };
  }

  const client = new IORedis(url, opts);

  // Suppress unhandled error events that crash the process
  client.on('error', (err) => {
    logger.warn(`Redis error: ${err.message}`);
  });

  // Attempt connection
  client.connect().catch((err) => {
    logger.warn(`Redis connect failed: ${err.message} — running without Redis`);
  });

  return client;
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis | null => buildClient(),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
