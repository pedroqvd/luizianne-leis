import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../infra/database/database.module';
import { Vote } from '../../../shared/types';

@Injectable()
export class VoteRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listByProposition(propositionId: number): Promise<Vote[]> {
    const { rows } = await this.pool.query(
      `SELECT v.id, v.proposition_id, v.deputy_id, v.vote, v.session_id, v.date,
              d.name AS deputy_name, d.party, d.state
         FROM votes v
         LEFT JOIN deputies d ON d.id = v.deputy_id
         WHERE v.proposition_id = $1
         ORDER BY v.date DESC NULLS LAST`,
      [propositionId],
    );
    return rows;
  }

  async listByDeputy(deputyId: number, limit = 200) {
    const { rows } = await this.pool.query(
      `SELECT v.*, p.title AS proposition_title, p.type AS proposition_type
         FROM votes v
         JOIN propositions p ON p.id = v.proposition_id
         WHERE v.deputy_id = $1
         ORDER BY v.date DESC NULLS LAST
         LIMIT $2`,
      [deputyId, limit],
    );
    return rows;
  }

  async upsert(v: {
    proposition_id: number;
    deputy_id: number | null;
    vote: string;
    session_id: string | null;
    date: string | null;
    payload?: any;
  }): Promise<{ isNew: boolean }> {
    const { rowCount } = await this.pool.query(
      `INSERT INTO votes (proposition_id, deputy_id, vote, session_id, date, payload)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (proposition_id, deputy_id, session_id) DO UPDATE
         SET vote = EXCLUDED.vote,
             date = EXCLUDED.date,
             payload = EXCLUDED.payload`,
      [v.proposition_id, v.deputy_id, v.vote, v.session_id, v.date, v.payload ?? null],
    );
    return { isNew: (rowCount ?? 0) > 0 };
  }

  async list(limit = 100, offset = 0) {
    const { rows } = await this.pool.query(
      `SELECT v.*, p.title AS proposition_title, d.name AS deputy_name
         FROM votes v
         JOIN propositions p ON p.id = v.proposition_id
         LEFT JOIN deputies d ON d.id = v.deputy_id
         ORDER BY v.date DESC NULLS LAST
         LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return rows;
  }
}
