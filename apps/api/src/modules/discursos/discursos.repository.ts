import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';

export interface DiscursosFilter {
  search?: string;
  ano?: number;
  tipo?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class DiscursosRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async upsert(deputyId: number, row: Record<string, any>): Promise<void> {
    if (!row.dataHoraInicio) return;
    await this.pool.query(
      `INSERT INTO discursos (
        deputy_id, data_hora_inicio, data_hora_fim, fase, tipo,
        keywords, sumario, url_texto, url_audio, url_video, payload, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
      ON CONFLICT (deputy_id, data_hora_inicio) DO UPDATE SET
        data_hora_fim = EXCLUDED.data_hora_fim,
        fase          = EXCLUDED.fase,
        tipo          = EXCLUDED.tipo,
        keywords      = EXCLUDED.keywords,
        sumario       = EXCLUDED.sumario,
        url_texto     = EXCLUDED.url_texto,
        url_audio     = EXCLUDED.url_audio,
        url_video     = EXCLUDED.url_video,
        payload       = EXCLUDED.payload,
        updated_at    = NOW()`,
      [
        deputyId,
        row.dataHoraInicio,
        row.dataHoraFim ?? null,
        row.faseEvento?.titulo ?? null,
        row.tipoDiscurso ?? null,
        row.keywords ?? null,
        row.sumario ?? null,
        row.urlTexto ?? null,
        row.urlAudio ?? null,
        row.urlVideo ?? null,
        JSON.stringify(row),
      ],
    );
  }

  async list(filter: DiscursosFilter) {
    const extId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    const conditions: string[] = ['d.deputy_id = (SELECT id FROM deputies WHERE external_id = $1 LIMIT 1)'];
    const params: any[] = [extId];
    let i = 2;

    if (filter.ano) {
      conditions.push(`EXTRACT(YEAR FROM d.data_hora_inicio) = $${i++}`);
      params.push(filter.ano);
    }
    if (filter.tipo) {
      conditions.push(`d.tipo ILIKE $${i++}`);
      params.push(`%${filter.tipo}%`);
    }
    if (filter.search) {
      conditions.push(
        `(to_tsvector('portuguese', coalesce(d.keywords,'') || ' ' || coalesce(d.sumario,''))
          @@ websearch_to_tsquery('portuguese', $${i++}))`,
      );
      params.push(filter.search);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const limit = Math.min(Math.max(Number(filter.limit) || 30, 1), 100);
    const offset = Math.max(Number(filter.offset) || 0, 0);
    params.push(limit, offset);

    const [{ rows }, { rows: cnt }] = await Promise.all([
      this.pool.query(
        `SELECT d.id, d.data_hora_inicio, d.data_hora_fim, d.fase, d.tipo,
                d.keywords, d.sumario, d.url_texto, d.url_audio, d.url_video
           FROM discursos d ${where}
           ORDER BY d.data_hora_inicio DESC
           LIMIT $${i} OFFSET $${i + 1}`,
        params,
      ),
      this.pool.query(
        `SELECT COUNT(*)::int AS c FROM discursos d ${where}`,
        params.slice(0, -2),
      ),
    ]);

    return { rows, total: cnt[0]?.c ?? 0 };
  }

  async stats() {
    const extId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    const { rows } = await this.pool.query(
      `SELECT
         COUNT(*)::int                                           AS total,
         COUNT(DISTINCT EXTRACT(YEAR FROM data_hora_inicio))::int AS anos,
         COUNT(DISTINCT tipo)::int                               AS tipos,
         MIN(data_hora_inicio)::date                             AS primeiro,
         MAX(data_hora_inicio)::date                             AS ultimo
         FROM discursos
         WHERE deputy_id = (SELECT id FROM deputies WHERE external_id = $1 LIMIT 1)`,
      [extId],
    );
    return rows[0];
  }

  async byYear() {
    const extId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    const { rows } = await this.pool.query(
      `SELECT EXTRACT(YEAR FROM data_hora_inicio)::int AS ano,
              COUNT(*)::int                            AS total
         FROM discursos
         WHERE deputy_id = (SELECT id FROM deputies WHERE external_id = $1 LIMIT 1)
         GROUP BY ano
         ORDER BY ano DESC`,
      [extId],
    );
    return rows;
  }

  async byTipo() {
    const extId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    const { rows } = await this.pool.query(
      `SELECT tipo, COUNT(*)::int AS total
         FROM discursos
         WHERE deputy_id = (SELECT id FROM deputies WHERE external_id = $1 LIMIT 1)
           AND tipo IS NOT NULL
         GROUP BY tipo
         ORDER BY total DESC`,
      [extId],
    );
    return rows;
  }
}
