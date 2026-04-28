import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const externalId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 141401);

  await pool.query(
    `INSERT INTO deputies (external_id, name, party, state)
     VALUES ($1, 'Luizianne Lins', 'PT', 'CE')
     ON CONFLICT (external_id) DO NOTHING`,
    [externalId],
  );

  console.log(`seeded deputy external_id=${externalId}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
