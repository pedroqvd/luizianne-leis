import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';

export interface CeapFilter {
  ano?: number;
  tipo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class CeapRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async upsert(deputyId: number, row: Record<string, any>): Promise<void> {
    await this.pool.query(
      `INSERT INTO ceap_despesas (
        deputy_id, ano, mes, tipo_despesa, cod_documento, tipo_documento,
        data_documento, num_documento, valor_bruto, valor_glosa, valor_liquido,
        num_ressarcimento, cod_lote, fornecedor, nome_fornecedor, cnpj_cpf,
        url_documento, payload, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())
      ON CONFLICT (deputy_id, ano, mes, cod_documento) DO UPDATE SET
        tipo_despesa      = EXCLUDED.tipo_despesa,
        valor_bruto       = EXCLUDED.valor_bruto,
        valor_glosa       = EXCLUDED.valor_glosa,
        valor_liquido     = EXCLUDED.valor_liquido,
        url_documento     = EXCLUDED.url_documento,
        payload           = EXCLUDED.payload,
        updated_at        = NOW()`,
      [
        deputyId,
        row.ano, row.mes, row.tipoDespesa,
        row.codDocumento != null ? String(row.codDocumento) : null, row.tipoDocumento,
        row.dataDocumento ?? null, row.numDocumento,
        row.valorBruto ?? 0, row.valorGlosa ?? 0, row.valorLiquido ?? row.valorLíquido ?? 0,
        row.numRessarcimento, row.codLote != null ? String(row.codLote) : null,
        row.fornecedor, row.nomeFornecedor, row.cnpjCpfFornecedor,
        row.urlDocumento, JSON.stringify(row),
      ],
    );
  }

  async list(filter: CeapFilter) {
    const conditions: string[] = ['d.deputy_id = (SELECT id FROM deputies WHERE external_id = $1 LIMIT 1)'];
    const params: any[] = [Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866)];
    let i = 2;

    if (filter.ano) {
      conditions.push(`d.ano = $${i++}`);
      params.push(filter.ano);
    }
    if (filter.tipo) {
      conditions.push(`d.tipo_despesa ILIKE $${i++}`);
      params.push(`%${filter.tipo}%`);
    }
    if (filter.search) {
      conditions.push(`(d.fornecedor ILIKE $${i++} OR d.nome_fornecedor ILIKE $${i++} OR d.cnpj_cpf ILIKE $${i++})`);
      params.push(`%${filter.search}%`, `%${filter.search}%`, `%${filter.search}%`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const limit = Math.min(Math.max(Number(filter.limit) || 60, 1), 200);
    const offset = Math.max(Number(filter.offset) || 0, 0);
    params.push(limit, offset);

    const [{ rows }, { rows: cnt }] = await Promise.all([
      this.pool.query(
        `SELECT d.id, d.ano, d.mes, d.tipo_despesa, d.data_documento,
                d.valor_bruto, d.valor_glosa, d.valor_liquido,
                d.fornecedor, d.nome_fornecedor, d.cnpj_cpf, d.url_documento
           FROM ceap_despesas d ${where}
           ORDER BY d.ano DESC, d.mes DESC, d.data_documento DESC NULLS LAST
           LIMIT $${i} OFFSET $${i + 1}`,
        params,
      ),
      this.pool.query(
        `SELECT COUNT(*)::int AS c FROM ceap_despesas d ${where}`,
        params.slice(0, -2),
      ),
    ]);

    return { rows, total: cnt[0]?.c ?? 0 };
  }

  async stats() {
    const extId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    const { rows } = await this.pool.query(
      `SELECT
         COUNT(*)::int                                      AS total,
         COUNT(DISTINCT ano)::int                           AS anos,
         COUNT(DISTINCT tipo_despesa)::int                  AS tipos,
         COUNT(DISTINCT cnpj_cpf)::int                      AS fornecedores,
         COALESCE(SUM(valor_liquido),0)::numeric(14,2)      AS total_liquido,
         COALESCE(SUM(valor_bruto),0)::numeric(14,2)        AS total_bruto,
         COALESCE(SUM(valor_glosa),0)::numeric(14,2)        AS total_glosa,
         MIN(ano)::int                                      AS ano_inicio,
         MAX(ano)::int                                      AS ano_fim
         FROM ceap_despesas
         WHERE deputy_id = (SELECT id FROM deputies WHERE external_id = $1 LIMIT 1)`,
      [extId],
    );
    return rows[0];
  }

  async byYear() {
    const extId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    const { rows } = await this.pool.query(
      `SELECT ano,
              COUNT(*)::int              AS total,
              SUM(valor_liquido)::numeric(14,2) AS liquido,
              SUM(valor_bruto)::numeric(14,2)   AS bruto
         FROM ceap_despesas
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
      `SELECT tipo_despesa,
              COUNT(*)::int              AS total,
              SUM(valor_liquido)::numeric(14,2) AS liquido
         FROM ceap_despesas
         WHERE deputy_id = (SELECT id FROM deputies WHERE external_id = $1 LIMIT 1)
           AND tipo_despesa IS NOT NULL
         GROUP BY tipo_despesa
         ORDER BY liquido DESC NULLS LAST`,
      [extId],
    );
    return rows;
  }
}
