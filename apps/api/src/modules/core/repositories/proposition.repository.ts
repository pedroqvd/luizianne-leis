import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as crypto from 'node:crypto';
import { PG_POOL } from '../../../infra/database/database.module';
import { Proposition, AuthorRole } from '../../../shared/types';

export interface PropositionFilter {
  type?: string;
  year?: number;
  status?: string;
  authorDeputyId?: number;
  role?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class PropositionRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findById(id: number, db: import('pg').Pool | import('pg').PoolClient = this.pool): Promise<Proposition | null> {
    const { rows } = await db.query(
      `SELECT * FROM propositions WHERE id = $1 LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findByExternalId(externalId: number, db: import('pg').Pool | import('pg').PoolClient = this.pool): Promise<Proposition | null> {
    const { rows } = await db.query(
      `SELECT * FROM propositions WHERE external_id = $1 LIMIT 1`,
      [externalId],
    );
    return rows[0] ?? null;
  }

  async list(filter: PropositionFilter): Promise<{ rows: Proposition[]; total: number }> {
    const where: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (filter.type)   { where.push(`p.type = $${i++}`);   params.push(filter.type); }
    if (filter.year)   { where.push(`p.year = $${i++}`);   params.push(filter.year); }
    if (filter.status) { where.push(`p.status = $${i++}`); params.push(filter.status); }
    if (filter.search) {
      where.push(`p.search_vector @@ websearch_to_tsquery('portuguese', $${i})`);
      params.push(filter.search);
      i++;
    }

    let from = `propositions p`;
    if (filter.authorDeputyId || filter.role) {
      from += ` JOIN proposition_authors pa ON pa.proposition_id = p.id`;
      if (filter.authorDeputyId) {
        from += ` AND pa.deputy_id = $${i++}`;
        params.push(filter.authorDeputyId);
      } else if (filter.role) {
        // Role filter must always be scoped to the target deputy to avoid cross-deputy leakage
        from += ` JOIN deputies d_role ON d_role.id = pa.deputy_id AND d_role.external_id = $${i++}`;
        params.push(Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866));
      }
      if (filter.role) {
        from += ` AND pa.role = $${i++}`;
        params.push(filter.role);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // FIX #1: limit e offset agora são parametrizados ($N) — elimina SQL injection
    const limit = Math.min(Math.max(Number(filter.limit) || 50, 1), 200);
    const offset = Math.max(Number(filter.offset) || 0, 0);

    const limitIdx = i++;
    const offsetIdx = i++;
    const targetExtIdx = i++; // only used in dataSql subquery, not in countSql
    params.push(limit, offset);

    const targetExtId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    // dataParams adds targetExtId at end — countSql receives only filterParams (no limit/offset/targetExtId)
    const dataParams = [...params, targetExtId];

    const dataSql = `
      SELECT DISTINCT p.id, p.external_id, p.type, p.number, p.year, p.title, p.summary, p.status, p.keywords, p.url, p.presented_at, p.updated_at,
        (SELECT pa2.role FROM proposition_authors pa2
          JOIN deputies d2 ON d2.id = pa2.deputy_id
          WHERE pa2.proposition_id = p.id AND d2.external_id = $${targetExtIdx}
          LIMIT 1) AS deputy_role
      FROM ${from}
      ${whereSql}
      ORDER BY p.presented_at DESC NULLS LAST, p.id DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
    const countSql = `SELECT COUNT(DISTINCT p.id)::int AS c FROM ${from} ${whereSql}`;

    // countSql usa apenas os params de filtro (sem limit/offset/targetExtId)
    const filterParams = params.slice(0, params.length - 2);

    const [data, count] = await Promise.all([
      this.pool.query(dataSql, dataParams),
      this.pool.query(countSql, filterParams),
    ]);

    return { rows: data.rows, total: count.rows[0].c };
  }

  async listByDeputy(
    deputyId: number,
    role?: AuthorRole,
    limit = 100,
  ): Promise<Proposition[]> {
    const params: any[] = [deputyId, limit];
    const roleClause = role ? `AND pa.role = $3` : '';
    if (role) params.push(role);

    const { rows } = await this.pool.query(
      `SELECT p.id, p.external_id, p.type, p.number, p.year, p.title, p.summary, p.status, p.keywords, p.url, p.presented_at, p.updated_at
         FROM propositions p
         JOIN proposition_authors pa ON pa.proposition_id = p.id
         WHERE pa.deputy_id = $1 ${roleClause}
         ORDER BY p.presented_at DESC NULLS LAST
         LIMIT $2`,
      params,
    );
    return rows;
  }

  async upsert(p: {
    external_id: number;
    type: string;
    number: number | null;
    year: number | null;
    title: string | null;
    summary: string | null;
    status: string | null;
    keywords?: string | null;
    url?: string | null;
    presented_at?: string | null;
    payload?: any;
  }, db: import('pg').Pool | import('pg').PoolClient = this.pool): Promise<{ proposition: Proposition; isNew: boolean; statusChanged: boolean }> {
    const existing = await this.findByExternalId(p.external_id, db);
    const isNew = !existing;
    const statusChanged = !!existing && existing.status !== p.status;

    const { rows } = await db.query(
      `INSERT INTO propositions
         (external_id, type, number, year, title, summary, status, keywords, url, presented_at, payload, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
       ON CONFLICT (external_id) DO UPDATE
         SET type = EXCLUDED.type,
             number = EXCLUDED.number,
             year = EXCLUDED.year,
             title = EXCLUDED.title,
             summary = EXCLUDED.summary,
             status = EXCLUDED.status,
             keywords = EXCLUDED.keywords,
             url = EXCLUDED.url,
             presented_at = EXCLUDED.presented_at,
             payload = EXCLUDED.payload,
             updated_at = now()
       RETURNING *`,
      [
        p.external_id,
        p.type,
        p.number,
        p.year,
        p.title,
        p.summary,
        p.status,
        p.keywords ?? null,
        p.url ?? null,
        p.presented_at ?? null,
        p.payload ?? null,
      ],
    );

    const proposition: Proposition = rows[0];

    const snapshot = JSON.stringify({ ...proposition, updated_at: undefined });
    const hash = crypto.createHash('sha256').update(snapshot).digest('hex');
    await db.query(
      `INSERT INTO proposition_versions (proposition_id, snapshot, snapshot_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (proposition_id, snapshot_hash) DO NOTHING`,
      [proposition.id, snapshot, hash],
    );

    return { proposition, isNew, statusChanged };
  }

  async upsertAuthor(
    propositionId: number,
    deputyId: number,
    role: AuthorRole,
    ordem: number | null = null,
    db: import('pg').Pool | import('pg').PoolClient = this.pool
  ): Promise<{ isNew: boolean }> {
    const { rowCount } = await db.query(
      `INSERT INTO proposition_authors (proposition_id, deputy_id, role, ordem)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (proposition_id, deputy_id, role) DO NOTHING`,
      [propositionId, deputyId, role, ordem],
    );
    return { isNew: (rowCount ?? 0) > 0 };
  }

  async insertProceeding(p: {
    proposition_id: number;
    sequence: number | null;
    description: string | null;
    body: string | null;
    status_at_time: string | null;
    date: string | null;
    payload?: any;
  }, db: import('pg').Pool | import('pg').PoolClient = this.pool): Promise<{ isNew: boolean }> {
    const hashSrc = `${p.proposition_id}|${p.sequence}|${p.description}|${p.date}`;
    const hash = crypto.createHash('sha256').update(hashSrc).digest('hex');

    const { rowCount } = await db.query(
      `INSERT INTO proceedings
         (proposition_id, sequence, description, body, status_at_time, date, payload, hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (proposition_id, hash) DO NOTHING`,
      [
        p.proposition_id,
        p.sequence,
        p.description,
        p.body,
        p.status_at_time,
        p.date,
        p.payload ?? null,
        hash,
      ],
    );
    return { isNew: (rowCount ?? 0) > 0 };
  }

  async listProceedings(propositionId: number) {
    const { rows } = await this.pool.query(
      `SELECT id, sequence, description, body, status_at_time, date
         FROM proceedings WHERE proposition_id = $1
         ORDER BY date ASC NULLS LAST, sequence ASC NULLS LAST`,
      [propositionId],
    );
    return rows;
  }

  async listAuthors(propositionId: number) {
    const { rows } = await this.pool.query(
      `SELECT pa.role, pa.ordem, d.id, d.external_id, d.name, d.party, d.state
         FROM proposition_authors pa
         JOIN deputies d ON d.id = pa.deputy_id
         WHERE pa.proposition_id = $1
         ORDER BY pa.role, pa.ordem NULLS LAST`,
      [propositionId],
    );
    return rows;
  }

  async upsertRelation(r: {
    proposition_id: number;
    related_external_id: number;
    related_sigla_tipo?: string | null;
    related_numero?: number | null;
    related_ano?: number | null;
    related_ementa?: string | null;
    relation_type?: string;
  }): Promise<void> {
    const relatedInternal = await this.findByExternalId(r.related_external_id);
    await this.pool.query(
      `INSERT INTO proposition_relations
         (proposition_id, related_external_id, related_internal_id,
          related_sigla_tipo, related_numero, related_ano, related_ementa, relation_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (proposition_id, related_external_id) DO UPDATE
         SET related_internal_id  = EXCLUDED.related_internal_id,
             related_sigla_tipo   = EXCLUDED.related_sigla_tipo,
             related_numero       = EXCLUDED.related_numero,
             related_ano          = EXCLUDED.related_ano,
             related_ementa       = EXCLUDED.related_ementa,
             relation_type        = EXCLUDED.relation_type`,
      [
        r.proposition_id,
        r.related_external_id,
        relatedInternal?.id ?? null,
        r.related_sigla_tipo ?? null,
        r.related_numero ?? null,
        r.related_ano ?? null,
        r.related_ementa ?? null,
        r.relation_type ?? 'relacionada',
      ],
    );
  }

  async listRelations(propositionId: number) {
    const { rows } = await this.pool.query(
      `SELECT pr.related_external_id, pr.related_internal_id,
              pr.related_sigla_tipo, pr.related_numero, pr.related_ano,
              pr.related_ementa, pr.relation_type,
              p.title AS related_title, p.status AS related_status, p.url AS related_url
         FROM proposition_relations pr
         LEFT JOIN propositions p ON p.id = pr.related_internal_id
         WHERE pr.proposition_id = $1
         ORDER BY pr.related_ano DESC NULLS LAST, pr.related_numero DESC NULLS LAST`,
      [propositionId],
    );
    return rows;
  }
}
