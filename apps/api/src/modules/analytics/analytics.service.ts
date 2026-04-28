import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';
import { CacheService } from '../../infra/cache/cache.service';
import { DeputyService } from '../core/services/deputy.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly cache: CacheService,
    private readonly deputy: DeputyService,
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
             ORDER BY total DESC`,
          [d.id],
        ),
        this.pool.query(
          `SELECT p.year, COUNT(DISTINCT p.id)::int AS total
             FROM propositions p
             JOIN proposition_authors pa ON pa.proposition_id = p.id
             WHERE pa.deputy_id = $1 AND p.year IS NOT NULL
             GROUP BY p.year
             ORDER BY p.year ASC`,
          [d.id],
        ),
      ]);

      return {
        deputy: d,
        productivity: prod[0] ?? null,
        by_type: byType,
        by_year: byYear,
      };
    });
  }

  async productivity() {
    return this.cache.wrap('analytics:productivity', 300, async () => {
      const { rows } = await this.pool.query(
        `SELECT * FROM v_deputy_productivity ORDER BY total_propositions DESC LIMIT 50`,
      );
      return rows;
    });
  }

  async approval() {
    return this.cache.wrap('analytics:approval', 300, async () => {
      const { rows } = await this.pool.query(
        `SELECT status, COUNT(*)::int AS total
           FROM propositions
           WHERE status IS NOT NULL
           GROUP BY status
           ORDER BY total DESC`,
      );
      return rows;
    });
  }

  /**
   * Rede de coautoria centrada na deputada-alvo.
   * Retorna nodes (deputados) + edges (peso = número de proposições compartilhadas).
   */
  async network() {
    return this.cache.wrap('analytics:network', 600, async () => {
      const d = await this.deputy.getTarget();

      const { rows: edgesRaw } = await this.pool.query(
        `SELECT deputy_a, deputy_b, weight
           FROM v_coauthorship_edges
           WHERE deputy_a = $1 OR deputy_b = $1
           ORDER BY weight DESC
           LIMIT 200`,
        [d.id],
      );

      const partnerIds = new Set<number>();
      for (const e of edgesRaw) {
        partnerIds.add(e.deputy_a);
        partnerIds.add(e.deputy_b);
      }

      const ids = Array.from(partnerIds);
      const { rows: deputies } = ids.length
        ? await this.pool.query(
            `SELECT id, name, party, state FROM deputies WHERE id = ANY($1::int[])`,
            [ids],
          )
        : { rows: [] };

      return {
        center: d.id,
        nodes: deputies,
        edges: edgesRaw.map((e) => ({
          source: e.deputy_a,
          target: e.deputy_b,
          weight: e.weight,
        })),
      };
    });
  }
}
