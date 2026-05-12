/* eslint-disable */
// Standalone migration runner — executes at container boot via docker-entrypoint.sh.
// Pure Node + pg (no ts-node), safe to run in the minimal runtime image.

const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[migrate] DATABASE_URL not set');
    process.exit(1);
  }

  const needsSsl =
    /supabase|amazonaws|render|neon|aiven|cockroachlabs|cloudsql/i.test(url) ||
    process.env.PG_SSL === 'true';

  const ssl = needsSsl
    ? { rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : false;

  const pool = new Pool({
    connectionString: url,
    ssl,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 10_000,
  });

  // Verify connectivity before proceeding
  try {
    await pool.query('SELECT 1');
  } catch (e) {
    console.error('[migrate] cannot connect to database:', e.message);
    await pool.end();
    process.exit(1);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          SERIAL PRIMARY KEY,
      filename    TEXT UNIQUE NOT NULL,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const root =
    process.env.MIGRATIONS_DIR ??
    path.resolve(__dirname, '../../../db/migrations');

  if (!fs.existsSync(root)) {
    console.error('[migrate] migrations directory not found:', root);
    await pool.end();
    process.exit(1);
  }

  const files = fs
    .readdirSync(root)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let applied = 0;
  for (const file of files) {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file],
    );
    if (rowCount) {
      console.log('  skip', file);
      continue;
    }

    const sql = fs.readFileSync(path.join(root, file), 'utf8');
    console.log(' apply', file);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file],
      );
      await client.query('COMMIT');
      applied++;
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(`[migrate] FAILED on ${file}:`, e.message);
      client.release();
      await pool.end();
      process.exit(1);
    } finally {
      client.release();
    }
  }

  await pool.end();
  console.log(`[migrate] done. ${applied} migration(s) applied, ${files.length - applied} skipped.`);
}

main().catch((e) => {
  console.error('[migrate] unexpected error:', e);
  process.exit(1);
});
