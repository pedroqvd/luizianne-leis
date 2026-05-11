import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';

export interface EditalFilter {
  ministerio?: string;
  situacao?: string;
  modalidade?: string;
  uf?: string;
  search?: string;
  encerrandoEm?: number; // dias
  limit?: number;
  offset?: number;
}

@Injectable()
export class EditaisRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async upsert(row: Record<string, any>): Promise<void> {
    await this.pool.query(
      `INSERT INTO editais (
        pncp_id, titulo, orgao, ministerio, numero, objeto,
        modalidade, modalidade_codigo, cnpj_orgao, poder, esfera,
        uf, municipio, unidade_codigo, unidade_nome,
        valor_estimado, data_abertura, data_encerramento,
        data_proposta_inicio, data_proposta_fim, data_publicacao,
        situacao, url_fonte, url_edital, payload, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
        $16,$17,$18,$19,$20,$21,$22,$23,$24,$25,NOW()
      )
      ON CONFLICT (pncp_id) DO UPDATE SET
        situacao             = EXCLUDED.situacao,
        data_encerramento    = EXCLUDED.data_encerramento,
        data_proposta_fim    = EXCLUDED.data_proposta_fim,
        valor_estimado       = EXCLUDED.valor_estimado,
        url_edital           = EXCLUDED.url_edital,
        payload              = EXCLUDED.payload,
        updated_at           = NOW()`,
      [
        row.pncp_id, row.titulo, row.orgao, row.ministerio, row.numero, row.objeto,
        row.modalidade, row.modalidade_codigo, row.cnpj_orgao, row.poder, row.esfera,
        row.uf, row.municipio, row.unidade_codigo, row.unidade_nome,
        row.valor_estimado, row.data_abertura, row.data_encerramento,
        row.data_proposta_inicio, row.data_proposta_fim, row.data_publicacao,
        row.situacao, row.url_fonte, row.url_edital, JSON.stringify(row.payload),
      ],
    );
  }

  /**
   * FIX B1 (ALTO): limit e offset agora são parametrizados ($N) em vez de interpolados.
   * Mesma classe de vulnerabilidade do FIX #1 no PropositionRepository.
   */
  async list(filter: EditalFilter) {
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (filter.situacao) {
      conditions.push(`situacao = $${i++}`); params.push(filter.situacao);
    }
    if (filter.ministerio) {
      conditions.push(`(ministerio ILIKE $${i++} OR orgao ILIKE $${i++})`);
      params.push(`%${filter.ministerio}%`, `%${filter.ministerio}%`);
    }
    if (filter.modalidade) {
      conditions.push(`modalidade ILIKE $${i++}`); params.push(`%${filter.modalidade}%`);
    }
    if (filter.uf) {
      conditions.push(`uf = $${i++}`); params.push(filter.uf.toUpperCase());
    }
    if (filter.search) {
      conditions.push(`(titulo ILIKE $${i++} OR objeto ILIKE $${i++} OR orgao ILIKE $${i++})`);
      params.push(`%${filter.search}%`, `%${filter.search}%`, `%${filter.search}%`);
    }
    if (filter.encerrandoEm) {
      params.push(Number(filter.encerrandoEm));
      conditions.push(`data_proposta_fim BETWEEN NOW() AND NOW() + ($${i++} * INTERVAL '1 day')`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // FIX B1: Parametrizar limit e offset para eliminar SQL injection
    const limit = Math.min(Math.max(Number(filter.limit) || 50, 1), 200);
    const offset = Math.max(Number(filter.offset) || 0, 0);
    params.push(limit);
    const limitParam = `$${i++}`;
    params.push(offset);
    const offsetParam = `$${i++}`;

    const [{ rows }, { rows: cnt }] = await Promise.all([
      this.pool.query(
        `SELECT id, pncp_id, titulo, orgao, ministerio, numero, objeto,
                modalidade, valor_estimado, data_abertura, data_encerramento,
                data_proposta_inicio, data_proposta_fim, data_publicacao,
                situacao, url_fonte, url_edital, uf, municipio, unidade_nome, poder, esfera
           FROM editais ${where}
           ORDER BY
             CASE situacao WHEN 'aberto' THEN 0 WHEN 'suspenso' THEN 1 ELSE 2 END,
             data_proposta_fim ASC NULLS LAST, data_publicacao DESC NULLS LAST
           LIMIT ${limitParam} OFFSET ${offsetParam}`,
        params,
      ),
      this.pool.query(
        `SELECT COUNT(*)::int AS total FROM editais ${where}`,
        params.slice(0, params.length - 2), // count query doesn't need limit/offset
      ),
    ]);

    return { rows, total: cnt[0]?.total ?? 0 };
  }

  async findById(id: number) {
    const { rows } = await this.pool.query(
      `SELECT * FROM editais WHERE id = $1`, [id],
    );
    return rows[0] ?? null;
  }

  async stats() {
    const { rows } = await this.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE situacao = 'aberto')::int                                                   AS abertos,
        COUNT(*) FILTER (WHERE situacao = 'encerrado')::int                                                AS encerrados,
        COUNT(*) FILTER (WHERE situacao = 'suspenso')::int                                                 AS suspensos,
        COUNT(*) FILTER (WHERE situacao = 'revogado')::int                                                 AS revogados,
        COUNT(*) FILTER (WHERE situacao = 'aberto'
                           AND data_proposta_fim BETWEEN NOW() AND NOW() + INTERVAL '7 days')::int         AS encerrando_7d,
        COUNT(*) FILTER (WHERE situacao = 'aberto'
                           AND data_proposta_fim BETWEEN NOW() AND NOW() + INTERVAL '30 days')::int        AS encerrando_30d,
        COALESCE(SUM(valor_estimado) FILTER (WHERE situacao = 'aberto'), 0)::numeric(20,2)                 AS valor_total_abertos,
        COUNT(DISTINCT ministerio) FILTER (WHERE situacao = 'aberto')::int                                 AS ministerios_ativos,
        COUNT(*)::int                                                                                      AS total
      FROM editais
    `);
    return rows[0];
  }

  async ministries(): Promise<string[]> {
    const { rows } = await this.pool.query(
      `SELECT DISTINCT ministerio FROM editais
       WHERE situacao = 'aberto' AND ministerio IS NOT NULL
       ORDER BY ministerio ASC
       LIMIT 200`,
    );
    return rows.map((r) => r.ministerio);
  }
}
