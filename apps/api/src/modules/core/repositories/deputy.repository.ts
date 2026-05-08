import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../infra/database/database.module';
import { Deputy } from '../../../shared/types';

@Injectable()
export class DeputyRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findByExternalId(externalId: number, db: import('pg').Pool | import('pg').PoolClient = this.pool): Promise<Deputy | null> {
    const { rows } = await db.query(
      `SELECT id, external_id, name, party, state, photo_url
         FROM deputies WHERE external_id = $1 LIMIT 1`,
      [externalId],
    );
    return rows[0] ?? null;
  }

  async findById(id: number): Promise<Deputy | null> {
    const { rows } = await this.pool.query(
      `SELECT id, external_id, name, party, state, photo_url
         FROM deputies WHERE id = $1 LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findByName(name: string): Promise<Deputy | null> {
    const { rows } = await this.pool.query(
      `SELECT id, external_id, name, party, state, photo_url
         FROM deputies WHERE name ILIKE $1 ORDER BY id LIMIT 1`,
      [name],
    );
    return rows[0] ?? null;
  }

  async upsert(
    d: Partial<Deputy> & { external_id: number; name: string; payload?: any },
    db: import('pg').Pool | import('pg').PoolClient = this.pool
  ): Promise<Deputy> {
    const { rows } = await db.query(
      `INSERT INTO deputies (external_id, name, party, state, photo_url, payload, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (external_id) DO UPDATE
         SET name = EXCLUDED.name,
             party = EXCLUDED.party,
             state = EXCLUDED.state,
             photo_url = EXCLUDED.photo_url,
             payload = EXCLUDED.payload,
             updated_at = now()
       RETURNING id, external_id, name, party, state, photo_url`,
      [
        d.external_id,
        d.name,
        d.party ?? null,
        d.state ?? null,
        d.photo_url ?? null,
        d.payload ?? null,
      ],
    );
    return rows[0];
  }
}
