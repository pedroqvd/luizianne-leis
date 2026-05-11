import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';

@Injectable()
export class CommissionsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list() {
    const { rows } = await this.pool.query(
      `SELECT id, external_id, name, sigla, tipo, casa FROM commissions ORDER BY name ASC`,
    );
    return rows;
  }

  async upsert(c: { external_id: number; name: string; sigla?: string | null; tipo?: string | null; casa?: string | null; payload?: any }) {
    const inferredTipo = c.tipo ?? inferCommissionTipo(c.name);
    const inferredCasa = c.casa ?? inferCommissionCasa(c.name, c.sigla);
    const { rows } = await this.pool.query(
      `INSERT INTO commissions (external_id, name, sigla, tipo, casa, payload)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (external_id) DO UPDATE
         SET name    = EXCLUDED.name,
             sigla   = EXCLUDED.sigla,
             tipo    = EXCLUDED.tipo,
             casa    = EXCLUDED.casa,
             payload = EXCLUDED.payload
       RETURNING *`,
      [c.external_id, c.name, c.sigla ?? null, inferredTipo, inferredCasa, c.payload ?? null],
    );
    return rows[0];
  }

  async listForTarget() {
    const externalId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    const { rows } = await this.pool.query(
      `SELECT c.id AS commission_id, c.name AS commission_name, c.sigla AS commission_sigla,
              c.tipo AS commission_tipo, c.casa AS commission_casa,
              dc.id, dc.role, dc.started_at, dc.ended_at
         FROM deputy_commissions dc
         JOIN commissions c ON c.id = dc.commission_id
         JOIN deputies d ON d.id = dc.deputy_id
         WHERE d.external_id = $1
         ORDER BY dc.started_at DESC NULLS LAST`,
      [externalId],
    );
    return rows;
  }

  async listForDeputy(deputyId: number) {
    const { rows } = await this.pool.query(
      `SELECT c.id, c.name, c.sigla, c.tipo, c.casa, dc.role, dc.started_at, dc.ended_at
         FROM deputy_commissions dc
         JOIN commissions c ON c.id = dc.commission_id
         WHERE dc.deputy_id = $1
         ORDER BY dc.started_at DESC NULLS LAST`,
      [deputyId],
    );
    return rows;
  }

  async upsertMembership(m: {
    deputy_id: number;
    commission_id: number;
    role: string | null;
    started_at: string | null;
    ended_at: string | null;
  }) {
    await this.pool.query(
      `INSERT INTO deputy_commissions (deputy_id, commission_id, role, started_at, ended_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (deputy_id, commission_id, role, started_at) DO UPDATE
         SET ended_at = EXCLUDED.ended_at`,
      [m.deputy_id, m.commission_id, m.role, m.started_at, m.ended_at],
    );
  }
}

const MISTA_SIGLAS = new Set(['CMCVM', 'CMO', 'CMPCP', 'CMMC', 'CMSP', 'CMCAF', 'CMADS']);

function inferCommissionTipo(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('mista')) return 'mista';
  if (n.includes('parlamentar de inq')) return 'parlamentar de inquérito';
  if (n.includes('especial')) return 'especial';
  if (n.includes('temporária') || n.includes('temporaria')) return 'temporária';
  if (n.includes('subcomissão') || n.includes('subcomissao')) return 'subcomissão';
  if (n.includes('externa')) return 'externa';
  return 'permanente';
}

function inferCommissionCasa(name: string, sigla?: string | null): string {
  if (sigla && MISTA_SIGLAS.has(sigla.toUpperCase())) return 'congresso';
  if (name.toLowerCase().includes('mista')) return 'congresso';
  return 'camara';
}
