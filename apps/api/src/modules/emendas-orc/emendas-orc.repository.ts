import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';

export interface EmendasOrcFilter {
  ano?: number;
  tipo?: string;
  uf?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class EmendasOrcRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async upsert(e: {
    ano: number;
    codigo_emenda: string | null;
    numero_emenda?: string | null;
    tipo_emenda?: string | null;
    funcao?: string | null;
    descricao_funcao?: string | null;
    subfuncao?: string | null;
    descricao_subfuncao?: string | null;
    descricao?: string | null;
    valor_dotacao?: number | null;
    valor_empenhado?: number | null;
    valor_liquidado?: number | null;
    valor_pago?: number | null;
    orgao_orcamentario?: string | null;
    municipio?: string | null;
    uf?: string | null;
    situacao?: string | null;
    payload?: any;
  }) {
    await this.pool.query(
      `INSERT INTO emendas_orcamentarias
         (ano, codigo_emenda, numero_emenda, tipo_emenda,
          funcao, descricao_funcao, subfuncao, descricao_subfuncao, descricao,
          valor_dotacao, valor_empenhado, valor_liquidado, valor_pago,
          orgao_orcamentario, municipio, uf, situacao, payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (codigo_emenda) DO UPDATE SET
         numero_emenda    = EXCLUDED.numero_emenda,
         valor_dotacao    = EXCLUDED.valor_dotacao,
         valor_empenhado  = EXCLUDED.valor_empenhado,
         valor_liquidado  = EXCLUDED.valor_liquidado,
         valor_pago       = EXCLUDED.valor_pago,
         situacao         = EXCLUDED.situacao,
         payload          = EXCLUDED.payload,
         updated_at       = now()`,
      [
        e.ano, e.codigo_emenda, e.numero_emenda ?? null, e.tipo_emenda ?? null,
        e.funcao ?? null, e.descricao_funcao ?? null, e.subfuncao ?? null, e.descricao_subfuncao ?? null,
        e.descricao ?? null,
        e.valor_dotacao ?? null, e.valor_empenhado ?? null, e.valor_liquidado ?? null, e.valor_pago ?? null,
        e.orgao_orcamentario ?? null, e.municipio ?? null, e.uf ?? null, e.situacao ?? null,
        e.payload ?? null,
      ],
    );
  }

  async list(filter: EmendasOrcFilter) {
    const where: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (filter.ano)    { where.push(`ano = $${i++}`);                              params.push(filter.ano); }
    if (filter.tipo)   { where.push(`tipo_emenda = $${i++}`);                      params.push(filter.tipo); }
    if (filter.uf)     { where.push(`UPPER(uf) = UPPER($${i++})`);                  params.push(filter.uf); }
    if (filter.search) { where.push(`(descricao ILIKE $${i} OR municipio ILIKE $${i} OR orgao_orcamentario ILIKE $${i})`); params.push(`%${filter.search}%`); i++; }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit  = Math.min(filter.limit ?? 60, 200);
    const offset = filter.offset ?? 0;

    const limitIdx = i++;
    const offsetIdx = i++;
    params.push(limit, offset);

    const [data, count] = await Promise.all([
      this.pool.query(
        `SELECT id, ano, codigo_emenda, numero_emenda, tipo_emenda,
                funcao, descricao_funcao, subfuncao, descricao_subfuncao, descricao,
                valor_dotacao, valor_empenhado, valor_liquidado, valor_pago,
                orgao_orcamentario, municipio, uf, situacao
         FROM emendas_orcamentarias ${whereSql}
         ORDER BY ano DESC, valor_dotacao DESC NULLS LAST
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params,
      ),
      this.pool.query(
        `SELECT COUNT(*)::int AS c FROM emendas_orcamentarias ${whereSql}`,
        params.slice(0, -2),
      ),
    ]);

    return { rows: data.rows, total: count.rows[0].c as number };
  }

  async findById(id: number) {
    const { rows } = await this.pool.query(
      `SELECT * FROM emendas_orcamentarias WHERE id = $1 LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async stats() {
    const { rows } = await this.pool.query(`
      SELECT
        COUNT(*)::int                                              AS total,
        COUNT(DISTINCT ano)::int                                   AS anos,
        COUNT(DISTINCT uf)::int                                    AS estados,
        COUNT(DISTINCT municipio)::int                             AS municipios,
        COALESCE(SUM(valor_dotacao),0)::numeric                   AS total_dotacao,
        COALESCE(SUM(valor_empenhado),0)::numeric                 AS total_empenhado,
        COALESCE(SUM(valor_pago),0)::numeric                      AS total_pago,
        COUNT(*) FILTER (WHERE tipo_emenda ILIKE '%Individual%')::int  AS individual,
        COUNT(*) FILTER (WHERE tipo_emenda ILIKE '%Bancada%')::int     AS bancada
      FROM emendas_orcamentarias
    `);
    return rows[0] ?? null;
  }

  async byYear() {
    const { rows } = await this.pool.query(`
      SELECT ano,
             COUNT(*)::int              AS total,
             SUM(valor_dotacao)::numeric  AS dotacao,
             SUM(valor_empenhado)::numeric AS empenhado,
             SUM(valor_pago)::numeric    AS pago
        FROM emendas_orcamentarias
       GROUP BY ano
       ORDER BY ano DESC
    `);
    return rows;
  }

  async byFuncao() {
    const { rows } = await this.pool.query(`
      SELECT descricao_funcao AS funcao,
             COUNT(*)::int    AS total,
             SUM(valor_pago)::numeric AS pago
        FROM emendas_orcamentarias
       WHERE descricao_funcao IS NOT NULL
       GROUP BY descricao_funcao
       ORDER BY pago DESC NULLS LAST
       LIMIT 10
    `);
    return rows;
  }

  async byUf() {
    const { rows } = await this.pool.query(`
      SELECT uf,
             COUNT(*)::int    AS total,
             SUM(valor_pago)::numeric AS pago
        FROM emendas_orcamentarias
       WHERE uf IS NOT NULL
       GROUP BY uf
       ORDER BY pago DESC NULLS LAST
    `);
    return rows;
  }
}
