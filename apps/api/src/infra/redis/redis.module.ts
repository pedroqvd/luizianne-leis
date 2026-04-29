import { Global, Module } from '@nestjs/common';
import IORedis, { Redis, RedisOptions } from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * Upstash usa rediss:// (TLS). ioredis aceita a URL diretamente, mas algumas
 * configurações precisam ser explícitas para BullMQ funcionar bem em serverless.
 */
function buildClient(): Redis {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const isTls = url.startsWith('rediss://');
  const opts: RedisOptions = {
    maxRetriesPerRequest: null, // exigido pelo BullMQ
    enableReadyCheck: true,
    lazyConnect: false,
  };
  if (isTls) {
    // Upstash precisa permitir nomes alternativos de cert TLS sem rejeitar
    opts.tls = { rejectUnauthorized: false };
  }
  return new IORedis(url, opts);
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis => buildClient(),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
