import { Global, Module, OnApplicationShutdown, Inject } from '@nestjs/common';
import { Pool } from 'pg';

export const PG_POOL = Symbol('PG_POOL');

/**
 * SSL é obrigatório no Supabase e na maioria dos hosted Postgres.
 * Detectamos pelo host na URL para não exigir config manual.
 */
function buildSslConfig(connectionString?: string) {
  if (!connectionString) return false;
  const needsSsl =
    /supabase|amazonaws|render|neon|aiven|cockroachlabs|cloudsql/i.test(connectionString) ||
    process.env.PG_SSL === 'true';
  return needsSsl ? { rejectUnauthorized: false } : false;
}

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () =>
        new Pool({
          connectionString: process.env.DATABASE_URL,
          min: Number(process.env.PG_POOL_MIN ?? 1),
          max: Number(process.env.PG_POOL_MAX ?? 5),
          ssl: buildSslConfig(process.env.DATABASE_URL),
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 10_000,
        }),
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
