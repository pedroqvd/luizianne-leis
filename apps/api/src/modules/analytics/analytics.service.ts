import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';
import { CacheService } from '../../infra/cache/cache.service';
import { DeputyService } from '../core/services/deputy.service';
import { ClassifierService } from '../nlp/classifier.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly cache: CacheService,
    private readonly deputy: DeputyService,
    private readonly classifier: ClassifierService,
  ) {}

  async summary() {
    return this.cache.wrap('analytics:summary', 120, async () => {
      const d = await this.deputy.getTarget();
      const [{ rows: prod }, { rows: byType }, { rows: byYear }] = await Promise.all([
        this.pool.query(
          `SELECT * FROM v_deputy_productivity WHERE deputy_id = $1`,
          [d.id],
        ),
        this.pool.query(
          `SELECT p.type, COUNT(DISTINCT p.id)::int AS total
             FROM propositions p
             JOIN proposition_authors pa ON pa.proposition_id = p.id
             WHERE pa.deputy_id = $1
             GROUP BY p.type
             ORDER BY total DESC
             LIMIT 50`,
          [d.id],
        ),
        this.pool.query(
          `SELECT p.year, COUNT(DISTINCT p.id)::int AS total
             FROM propositions p
             JOIN proposition_authors pa ON pa.proposition_id = p.id
             WHERE pa.deputy_id = $1 AND p.year IS NOT NULL
             GROUP BY p.year
             ORDER BY p.year ASC
             LIMIT 50`,
          [d.id],
        ),
      ]);

      const row = prod[0];
      return {
        deputy: d,
        productivity: row
          ? {
              total_propositions: row.total_propositions,
              authored: row.as_author,
              coauthored: row.as_coauthor,
              rapporteured: row.as_rapporteur,
            }
          : null,
        by_type: byType,
        by_year: byYear,
      };
    });
  }

  async productivity() {
    return this.cache.wrap('analytics:productivity', 300, async () => {
      // FIX #15: LIMIT já existia (50), mantido
      const { rows } = await this.pool.query(
        `SELECT * FROM v_deputy_productivity ORDER BY total_propositions DESC LIMIT 50`,
      );
      return rows;
    });
  }

  async approval() {
    return this.cache.wrap('analytics:approval', 300, async () => {
      const [byStatus, rates] = await Promise.all([
        this.pool.query(
          // FIX #15 (MÉDIO): Adicionado LIMIT para evitar respostas gigantes
          `SELECT status, COUNT(*)::int AS total
             FROM propositions
             WHERE status IS NOT NULL
             GROUP BY status
             ORDER BY total DESC
             LIMIT 100`,
        ),
        this.pool.query(
          `SELECT AVG(approval_rate)::numeric(5,2) AS avg_approval,
                  COUNT(*) FILTER (WHERE total_votes > 0)::int AS voted,
                  COUNT(*)::int AS total
             FROM v_proposition_approval`,
        ),
      ]);
      return {
        by_status: byStatus.rows,
        overall: rates.rows[0] ?? null,
      };
    });
  }

  async categories() {
    return this.cache.wrap('analytics:categories', 600, () => this.classifier.breakdown());
  }

  async heatmap() {
    return this.cache.wrap('analytics:heatmap', 300, async () => {
      const d = await this.deputy.getTarget();
      const { rows } = await this.pool.query(
        // Full legislative history from 2003 (first mandate). No time window limit —
        // the deputy has been active since 2003 and the 2-year window hid 20+ years of data.
        // LIMIT 9999 guards against pathological data while covering ~23 years of activity.
        `SELECT DATE_TRUNC('day', p.presented_at)::date AS day,
                COUNT(DISTINCT p.id)::int AS total
           FROM propositions p
           JOIN proposition_authors pa ON pa.proposition_id = p.id
           WHERE pa.deputy_id = $1
             AND p.presented_at IS NOT NULL
           GROUP BY day
           ORDER BY day ASC
           LIMIT 9999`,
        [d.id],
      );
      return rows as { day: string; total: number }[];
    });
  }

  /**
   * Rede de coautoria centrada na deputada-alvo.
   * FIX #3 (MÉDIO): Utiliza CTE (WITH) para resolver os parceiros direto no Postgres,
   * evitando N+1 em memória e tráfego de arrays pelo Node.
   */
  async network() {
    return this.cache.wrap('analytics:network', 600, async () => {
      const d = await this.deputy.getTarget();

      const { rows } = await this.pool.query(
        `WITH top_edges AS (
           SELECT deputy_a, deputy_b, weight
           FROM v_coauthorship_edges
           WHERE deputy_a = $1 OR deputy_b = $1
           ORDER BY weight DESC
           LIMIT 200
         ),
         partner_ids AS (
           SELECT deputy_a AS id FROM top_edges
           UNION
           SELECT deputy_b AS id FROM top_edges
         )
         SELECT
           (SELECT json_agg(json_build_object('id', dep.id, 'name', dep.name, 'party', dep.party, 'state', dep.state))
            FROM partner_ids p JOIN deputies dep ON dep.id = p.id) AS nodes,
           (SELECT json_agg(json_build_object('source', e.deputy_a, 'target', e.deputy_b, 'weight', e.weight))
            FROM top_edges e) AS edges`,
        [d.id],
      );

      const data = rows[0] || { nodes: [], edges: [] };

      return {
        center: d.id,
        nodes: data.nodes || [],
        edges: data.edges || [],
      };
    });
  }
}
