import { Global, Module, OnApplicationShutdown, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'node:fs';
import * as path from 'node:path';

export const PG_POOL = Symbol('PG_POOL');

/**
 * SSL é obrigatório no Supabase e na maioria dos hosted Postgres.
 * Detectamos pelo host na URL para não exigir config manual.
 *
 * FIX #10 (ALTO): rejectUnauthorized agora é true por padrão em produção.
 * Use PG_SSL_REJECT_UNAUTHORIZED=false APENAS se necessário (dev/testing).
 */
function buildSslConfig(connectionString?: string) {
  if (!connectionString) return false;
  const needsSsl =
    /supabase|amazonaws|render|neon|aiven|cockroachlabs|cloudsql/i.test(connectionString) ||
    process.env.PG_SSL === 'true';
  if (!needsSsl) return false;

  return {
    rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
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
export class DatabaseModule implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;

    const dbUrl = process.env.DATABASE_URL ?? '';
    if (/@db\.[a-z0-9]+\.supabase\.co/i.test(dbUrl)) {
      this.logger.warn(
        'DATABASE_URL uses direct host (db.<ref>.supabase.co) which is IPv6-only on Supabase Free Tier and fails on Render IPv4 with AggregateError. Use the Session Pooler URL (aws-0-<region>.pooler.supabase.com:5432) instead!',
      );
    }

    try {
      await this.pool.query('SELECT 1');
      await this.runPendingMigrations();
    } catch (e: any) {
      this.logger.error(
        `Database connection / migration check failed: ${e.message || e.code || 'AggregateError (verifique se DATABASE_URL usa o Session Pooler IPv4 do Supabase)'}`,
      );
    }
  }

  private async runPendingMigrations() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          SERIAL PRIMARY KEY,
        filename    TEXT UNIQUE NOT NULL,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const candidateDirs = [
      process.env.MIGRATIONS_DIR,
      path.resolve(__dirname, '../../../../../db/migrations'),
      path.resolve(process.cwd(), 'db/migrations'),
      path.resolve(process.cwd(), '../../db/migrations'),
    ].filter((d): d is string => Boolean(d));

    const root = candidateDirs.find((d) => fs.existsSync(d));
    if (!root) {
      this.logger.debug('Migrations directory not found — skipping auto-migrate');
      return;
    }

    const files = fs
      .readdirSync(root)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let applied = 0;
    for (const file of files) {
      const { rowCount } = await this.pool.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file],
      );
      if (rowCount) continue;

      const sql = fs.readFileSync(path.join(root, file), 'utf8');
      this.logger.log(`Applying migration ${file}...`);

      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        applied++;
      } catch (e: any) {
        await client.query('ROLLBACK').catch(() => undefined);
        this.logger.error(`Migration ${file} failed: ${e.message} — continuing with remaining migrations`);
      } finally {
        client.release();
      }
    }

    if (applied > 0) {
      this.logger.log(`Auto-migration complete: ${applied} new migration(s) applied.`);
    } else {
      this.logger.log(`Database schema up to date (${files.length} migrations verified).`);
    }
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
