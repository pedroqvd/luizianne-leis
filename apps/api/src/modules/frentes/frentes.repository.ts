import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';

@Injectable()
export class FrentesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async upsertFrente(f: {
    external_id: number;
    titulo: string;
    keywords?: string | null;
    id_legislatura?: number | null;
    url_website?: string | null;
    payload?: any;
  }) {
    const { rows } = await this.pool.query(
      `INSERT INTO frentes_parlamentares
         (external_id, titulo, keywords, id_legislatura, url_website, payload, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (external_id) DO UPDATE
         SET titulo         = EXCLUDED.titulo,
             keywords       = EXCLUDED.keywords,
             id_legislatura = EXCLUDED.id_legislatura,
             url_website    = EXCLUDED.url_website,
             payload        = EXCLUDED.payload,
             updated_at     = NOW()
       RETURNING id`,
      [f.external_id, f.titulo, f.keywords ?? null, f.id_legislatura ?? null, f.url_website ?? null, f.payload ?? null],
    );
    return rows[0] as { id: number };
  }

  async upsertMembro(m: {
    deputy_id: number;
    frente_id: number;
    role?: string | null;
    payload?: any;
  }) {
    await this.pool.query(
      `INSERT INTO frente_membros (deputy_id, frente_id, role, payload)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (deputy_id, frente_id) DO UPDATE
         SET role    = EXCLUDED.role,
             payload = EXCLUDED.payload`,
      [m.deputy_id, m.frente_id, m.role ?? null, m.payload ?? null],
    );
  }

  async listForTarget(): Promise<any[]> {
    const externalId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    const { rows } = await this.pool.query(
      `SELECT fp.id, fp.external_id, fp.titulo, fp.keywords, fp.id_legislatura,
              fp.url_website, fm.role
         FROM frente_membros fm
         JOIN frentes_parlamentares fp ON fp.id = fm.frente_id
         JOIN deputies d ON d.id = fm.deputy_id
        WHERE d.external_id = $1
        ORDER BY fp.id_legislatura DESC NULLS LAST, fp.titulo ASC`,
      [externalId],
    );
    return rows;
  }

  async stats(): Promise<{ total: number; legislaturas: number }> {
    const externalId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    const { rows } = await this.pool.query(
      `SELECT
         COUNT(DISTINCT fm.frente_id)::int        AS total,
         COUNT(DISTINCT fp.id_legislatura)::int   AS legislaturas
       FROM frente_membros fm
       JOIN frentes_parlamentares fp ON fp.id = fm.frente_id
       JOIN deputies d ON d.id = fm.deputy_id
       WHERE d.external_id = $1`,
      [externalId],
    );
    return rows[0] ?? { total: 0, legislaturas: 0 };
  }
}
