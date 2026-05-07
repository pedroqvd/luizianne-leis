import { Global, Module } from '@nestjs/common';
import IORedis, { Redis, RedisOptions } from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * Upstash usa rediss:// (TLS). ioredis aceita a URL diretamente, mas algumas
 * configurações precisam ser explícitas para BullMQ funcionar bem em serverless.
 *
 * FIX #10 (ALTO): rejectUnauthorized agora é true por padrão.
 * Use REDIS_TLS_REJECT_UNAUTHORIZED=false APENAS se necessário.
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
    opts.tls = {
      rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
    };
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
