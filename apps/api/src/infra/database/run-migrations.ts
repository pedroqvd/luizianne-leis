import { Pool } from 'pg';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const root = path.resolve(__dirname, '../../../../../db/migrations');
  const files = fs.readdirSync(root).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file],
    );
    if (rowCount) {
      console.log(`= skip ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(root, file), 'utf8');
    console.log(`> apply ${file}`);
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await pool.query('COMMIT');
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }
  }

  await pool.end();
  console.log('migrations done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
