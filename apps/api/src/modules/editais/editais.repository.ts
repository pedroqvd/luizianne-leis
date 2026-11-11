import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';

export interface EditalFilter {
  ministerio?: string;
  situacao?: string;
  modalidade?: string;
  uf?: string;
  categoria?: string;
  elegivelPrefeituras?: boolean;
  comMatchPrefeitos?: boolean;
  search?: string;
  encerrandoEm?: number; // dias
  limit?: number;
  offset?: number;
}

@Injectable()
export class EditaisRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async upsert(row: Record<string, any>): Promise<void> {
    await this.upsertBatch([row]);
  }

  async upsertBatch(rows: Record<string, any>[]): Promise<number> {
    if (!rows.length) return 0;
    const chunkSize = 50;
    let total = 0;

    for (let c = 0; c < rows.length; c += chunkSize) {
      const chunk = rows.slice(c, c + chunkSize);
      const values: any[] = [];
      const placeholders: string[] = [];
      let p = 1;

      for (const row of chunk) {
        const tuple: string[] = [];
        for (let k = 0; k < 35; k++) {
          tuple.push(`$${p++}`);
        }
        tuple.push('NOW()');
        placeholders.push(`(${tuple.join(',')})`);

        values.push(
          row.pncp_id,
          row.titulo,
          row.orgao,
          row.ministerio,
          row.orgao_superior ?? row.ministerio ?? row.orgao,
          row.numero,
          row.objeto,
          row.modalidade,
          row.modalidade_codigo,
          row.cnpj_orgao,
          row.poder,
          row.esfera,
          row.uf,
          row.municipio,
          row.unidade_codigo,
          row.unidade_nome,
          row.valor_estimado,
          row.data_abertura,
          row.data_encerramento,
          row.data_proposta_inicio,
          row.data_proposta_fim,
          row.data_publicacao,
          row.situacao,
          row.url_fonte,
          row.url_edital,
          row.categoria_tematica ?? 'gestão e administração',
          row.keywords_extraidas ?? [],
          row.publico_alvo ?? ['prefeituras'],
          row.elegivel_prefeituras ?? true,
          row.abrangencia ?? 'Nacional',
          row.amparo_legal ?? null,
          row.modo_disputa ?? null,
          row.criterio_julgamento ?? null,
          row.origem ?? 'pncp',
          JSON.stringify(row.payload ?? {}),
        );
      }

      const { rowCount } = await this.pool.query(
        `INSERT INTO editais (
          pncp_id, titulo, orgao, ministerio, orgao_superior, numero, objeto,
          modalidade, modalidade_codigo, cnpj_orgao, poder, esfera,
          uf, municipio, unidade_codigo, unidade_nome,
          valor_estimado, data_abertura, data_encerramento,
          data_proposta_inicio, data_proposta_fim, data_publicacao,
          situacao, url_fonte, url_edital,
          categoria_tematica, keywords_extraidas, publico_alvo,
          elegivel_prefeituras, abrangencia, amparo_legal,
          modo_disputa, criterio_julgamento, origem,
          payload, updated_at
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT (pncp_id) DO UPDATE SET
          titulo               = EXCLUDED.titulo,
          orgao                = EXCLUDED.orgao,
          ministerio           = EXCLUDED.ministerio,
          orgao_superior       = EXCLUDED.orgao_superior,
          situacao             = EXCLUDED.situacao,
          data_encerramento    = EXCLUDED.data_encerramento,
          data_proposta_fim    = EXCLUDED.data_proposta_fim,
          valor_estimado       = EXCLUDED.valor_estimado,
          url_fonte            = EXCLUDED.url_fonte,
          url_edital           = EXCLUDED.url_edital,
          categoria_tematica   = EXCLUDED.categoria_tematica,
          keywords_extraidas   = EXCLUDED.keywords_extraidas,
          publico_alvo         = EXCLUDED.publico_alvo,
          elegivel_prefeituras = EXCLUDED.elegivel_prefeituras,
          abrangencia          = EXCLUDED.abrangencia,
          amparo_legal         = COALESCE(EXCLUDED.amparo_legal, editais.amparo_legal),
          modo_disputa         = COALESCE(EXCLUDED.modo_disputa, editais.modo_disputa),
          criterio_julgamento  = COALESCE(EXCLUDED.criterio_julgamento, editais.criterio_julgamento),
          payload              = EXCLUDED.payload,
          updated_at           = NOW()`,
        values,
      );
      total += rowCount ?? chunk.length;
    }

    return total;
  }

  /**
   * Atualiza automaticamente para 'encerrado' todos os editais 'aberto'
   * cujo prazo final de envio de proposta já expirou.
   */
  async expirePastDueEditais(): Promise<number> {
    const { rowCount } = await this.pool.query(
      `UPDATE editais
          SET situacao = 'encerrado',
              updated_at = NOW()
        WHERE situacao = 'aberto'
          AND data_proposta_fim IS NOT NULL
          AND data_proposta_fim < NOW()`,
    );
    return rowCount ?? 0;
  }

  async updateDeepDetails(
    id: number,
    itensResumo: any[],
    arquivosAnexos: any[],
  ): Promise<void> {
    await this.pool.query(
      `UPDATE editais
          SET itens_resumo = $2::jsonb,
              arquivos_anexos = $3::jsonb,
              updated_at = NOW()
        WHERE id = $1`,
      [id, JSON.stringify(itensResumo), JSON.stringify(arquivosAnexos)],
    );
  }

  async list(filter: EditalFilter) {
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (filter.situacao) {
      conditions.push(`e.situacao = $${i++}`);
      params.push(filter.situacao);
    }
    if (filter.ministerio) {
      conditions.push(`(e.ministerio ILIKE $${i++} OR e.orgao ILIKE $${i++})`);
      params.push(`%${filter.ministerio}%`, `%${filter.ministerio}%`);
    }
    if (filter.modalidade) {
      conditions.push(`e.modalidade ILIKE $${i++}`);
      params.push(`%${filter.modalidade}%`);
    }
    if (filter.uf) {
      conditions.push(`e.uf = $${i++}`);
      params.push(filter.uf.toUpperCase());
    }
    if (filter.categoria) {
      conditions.push(`e.categoria_tematica = $${i++}`);
      params.push(filter.categoria.toLowerCase());
    }
    if (filter.elegivelPrefeituras) {
      conditions.push(`e.elegivel_prefeituras = true`);
    }
    if (filter.comMatchPrefeitos) {
      conditions.push(
        `EXISTS (SELECT 1 FROM edital_authority_tracking t WHERE t.edital_id = e.id)`,
      );
    }
    if (filter.search) {
      const qParam = `$${i++}`;
      const likeParam = `$${i++}`;
      params.push(filter.search, `%${filter.search}%`);
      conditions.push(
        `(e.search_vector @@ websearch_to_tsquery('portuguese', ${qParam})
          OR e.titulo ILIKE ${likeParam}
          OR e.objeto ILIKE ${likeParam}
          OR e.orgao ILIKE ${likeParam}
          OR e.numero ILIKE ${likeParam})`,
      );
    }
    if (filter.encerrandoEm) {
      params.push(Number(filter.encerrandoEm));
      conditions.push(`e.data_proposta_fim BETWEEN NOW() AND NOW() + ($${i++} * INTERVAL '1 day')`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const limit = Math.min(Math.max(Number(filter.limit) || 50, 1), 200);
    const offset = Math.max(Number(filter.offset) || 0, 0);
    params.push(limit);
    const limitParam = `$${i++}`;
    params.push(offset);
    const offsetParam = `$${i++}`;

    const [{ rows }, { rows: cnt }] = await Promise.all([
      this.pool.query(
        `SELECT
           e.id, e.pncp_id, e.titulo, e.orgao, e.ministerio, e.orgao_superior,
           e.numero, e.objeto, e.modalidade, e.valor_estimado,
           e.data_abertura, e.data_encerramento,
           e.data_proposta_inicio, e.data_proposta_fim, e.data_publicacao,
           e.situacao, e.url_fonte, e.url_edital,
           e.uf, e.municipio, e.unidade_nome, e.poder, e.esfera,
           e.categoria_tematica, e.keywords_extraidas, e.publico_alvo,
           e.elegivel_prefeituras, e.abrangencia, e.amparo_legal,
           e.modo_disputa, e.criterio_julgamento, e.origem,
           COALESCE(m.matched_authorities_count, 0)::int AS matched_authorities_count,
           COALESCE(m.max_match_score, 0)::numeric(5,2)  AS max_match_score,
           COALESCE(m.matched_municipalities, '{}'::text[]) AS matched_municipalities
         FROM editais e
         LEFT JOIN LATERAL (
           SELECT
             COUNT(*)::int AS matched_authorities_count,
             MAX(t.match_score) AS max_match_score,
             ARRAY(
               SELECT cm.name
                 FROM edital_authority_tracking t2
                 JOIN municipal_authorities ma ON ma.id = t2.authority_id
                 JOIN ceara_municipalities cm ON cm.id = ma.municipality_id
                WHERE t2.edital_id = e.id
                ORDER BY t2.match_score DESC
                LIMIT 4
             ) AS matched_municipalities
           FROM edital_authority_tracking t
           WHERE t.edital_id = e.id
         ) m ON true
         ${where}
         ORDER BY
           CASE e.situacao WHEN 'aberto' THEN 0 WHEN 'suspenso' THEN 1 ELSE 2 END,
           COALESCE(m.max_match_score, 0) DESC,
           e.data_proposta_fim ASC NULLS LAST,
           e.data_publicacao DESC NULLS LAST
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        params,
      ),
      this.pool.query(
        `SELECT COUNT(*)::int AS total FROM editais e ${where}`,
        params.slice(0, params.length - 2),
      ),
    ]);

    return { rows, total: cnt[0]?.total ?? 0 };
  }

  async findById(id: number) {
    const { rows } = await this.pool.query(
      `SELECT * FROM editais WHERE id = $1`,
      [id],
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
        COUNT(*) FILTER (WHERE situacao = 'aberto' AND elegivel_prefeituras = true)::int                   AS elegiveis_prefeituras,
        (SELECT COUNT(DISTINCT edital_id)::int FROM edital_authority_tracking)                             AS com_match_prefeitos,
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

  async categories(): Promise<Array<{ category: string; count: number }>> {
    const { rows } = await this.pool.query(
      `SELECT categoria_tematica AS category, COUNT(*)::int AS count
         FROM editais
        WHERE situacao = 'aberto' AND categoria_tematica IS NOT NULL
        GROUP BY categoria_tematica
        ORDER BY count DESC, categoria_tematica ASC`,
    );
    return rows;
  }
}
