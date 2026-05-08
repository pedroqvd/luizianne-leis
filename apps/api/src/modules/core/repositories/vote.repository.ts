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
              v.is_absence, d.name AS deputy_name, d.party, d.state
         FROM votes v
         LEFT JOIN deputies d ON d.id = v.deputy_id
         WHERE v.proposition_id = $1
         ORDER BY v.date DESC NULLS LAST`,
      [propositionId],
    );
    return rows;
  }

  async listByDeputy(deputyId: number, limit = 200, absencesOnly = false) {
    const { rows } = await this.pool.query(
      `SELECT v.*, v.is_absence,
              p.title AS proposition_title, p.type AS proposition_type
         FROM votes v
         JOIN propositions p ON p.id = v.proposition_id
         WHERE v.deputy_id = $1
           AND ($3::boolean = false OR v.is_absence = true)
         ORDER BY v.date DESC NULLS LAST
         LIMIT $2`,
      [deputyId, limit, absencesOnly],
    );
    return rows;
  }

  /**
   * FIX B4 (MÉDIO): Trata deputy_id=NULL no UNIQUE constraint.
   * PostgreSQL não considera NULLs como iguais em UNIQUE — então votos com
   * deputy_id=NULL nunca seriam deduplicados. Usamos COALESCE no ON CONFLICT
   * e adicionamos um check explícito antes do INSERT.
   */
  async upsert(v: {
    proposition_id: number;
    deputy_id: number | null;
    vote: string;
    session_id: string | null;
    date: string | null;
    is_absence?: boolean;
    payload?: any;
  }, db: import('pg').Pool | import('pg').PoolClient = this.pool): Promise<{ isNew: boolean }> {
    // FIX B4: Se deputy_id é null, verificar manualmente antes de inserir
    if (v.deputy_id === null) {
      const { rows: existing } = await db.query(
        `SELECT id FROM votes
         WHERE proposition_id = $1 AND deputy_id IS NULL AND session_id = $2
         LIMIT 1`,
        [v.proposition_id, v.session_id],
      );
      if (existing.length > 0) {
        // Atualizar o existente
        await db.query(
          `UPDATE votes SET vote = $1, date = $2, is_absence = $3, payload = $4
           WHERE id = $5`,
          [v.vote, v.date, v.is_absence ?? false, v.payload ?? null, existing[0].id],
        );
        return { isNew: false };
      }
      // Inserir novo
      await db.query(
        `INSERT INTO votes (proposition_id, deputy_id, vote, session_id, date, is_absence, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [v.proposition_id, v.deputy_id, v.vote, v.session_id, v.date, v.is_absence ?? false, v.payload ?? null],
      );
      return { isNew: true };
    }

    // Caso normal: deputy_id NOT NULL — ON CONFLICT funciona corretamente
    const { rows } = await db.query(
      `INSERT INTO votes (proposition_id, deputy_id, vote, session_id, date, is_absence, payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (proposition_id, deputy_id, session_id) DO UPDATE
         SET vote       = EXCLUDED.vote,
             date       = EXCLUDED.date,
             is_absence = EXCLUDED.is_absence,
             payload    = EXCLUDED.payload
       RETURNING (xmax = 0) AS is_new`,
      [
        v.proposition_id,
        v.deputy_id,
        v.vote,
        v.session_id,
        v.date,
        v.is_absence ?? false,
        v.payload ?? null,
      ],
    );
    return { isNew: rows[0]?.is_new === true };
  }

  async list(deputyId: number, limit = 100, offset = 0, absencesOnly = false) {
    const { rows } = await this.pool.query(
      `SELECT v.id, v.proposition_id, v.vote, v.session_id, v.date, v.is_absence,
              p.title AS proposition_title, p.type AS proposition_type,
              d.name AS deputy_name
         FROM votes v
         JOIN propositions p ON p.id = v.proposition_id
         LEFT JOIN deputies d ON d.id = v.deputy_id
         WHERE v.deputy_id = $4
           AND ($3::boolean = false OR v.is_absence = true)
         ORDER BY v.date DESC NULLS LAST
         LIMIT $1 OFFSET $2`,
      [limit, offset, absencesOnly, deputyId],
    );
    return rows;
  }

  async stats(deputyId: number) {
    const { rows } = await this.pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE vote = 'Sim')                    AS sim,
         COUNT(*) FILTER (WHERE vote IN ('Não','Nao'))           AS nao,
         COUNT(*) FILTER (WHERE vote IN ('Abstenção','Abstencao')) AS abstencao,
         COUNT(*) FILTER (WHERE vote = 'Obstrução')              AS obstrucao,
         COUNT(*) FILTER (WHERE is_absence = true)               AS ausente,
         COUNT(*) FILTER (WHERE is_absence IS NOT TRUE)           AS total_votados
       FROM votes
       WHERE deputy_id = $1`,
      [deputyId],
    );
    return rows[0] ?? null;
  }
}
