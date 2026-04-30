import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';
import { EventBus } from '../../shared/event-bus';

const APPROVED_STATUSES = [
  'Aprovado',
  'Aprovada',
  'Transformado em Norma Jurídica',
  'Transformada em Norma Jurídica',
  'Sancionado',
  'Sancionada',
  'Publicado',
  'Publicada',
  'Promulgado',
  'Promulgada',
];

/**
 * Detecta semanalmente proposições que mudaram para status de "aprovada"
 * e emite eventos LAW_APPROVED para notificação por e-mail.
 */
@Injectable()
export class LawsAlertService {
  private readonly logger = new Logger(LawsAlertService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly events: EventBus,
  ) {}

  async checkApprovedLaws(): Promise<{ found: number }> {
    // Proposições da deputada que ficaram aprovadas na última semana
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { rows } = await this.pool.query(
      `SELECT DISTINCT p.id, p.type, p.number, p.year, p.title, p.status, p.url
         FROM propositions p
         JOIN proposition_authors pa ON pa.proposition_id = p.id
         JOIN deputies d ON d.id = pa.deputy_id
            AND d.external_id = $1::int
         JOIN system_events se ON se.aggregate_type = 'proposition'
            AND se.aggregate_id = p.id
            AND se.type = 'STATUS_CHANGED'
            AND se.created_at >= $2
         WHERE ${APPROVED_STATUSES.map((s, i) => `p.status ILIKE $${i + 3}`).join(' OR ')}`,
      [
        Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 141401),
        since.toISOString(),
        ...APPROVED_STATUSES.map((s) => `%${s}%`),
      ],
    );

    for (const row of rows) {
      this.events.emit({
        type: 'LAW_APPROVED',
        aggregateType: 'proposition',
        aggregateId: row.id,
        payload: {
          title:  row.title,
          type:   row.type,
          number: row.number,
          year:   row.year,
          status: row.status,
          url:    row.url,
        },
      });
    }

    if (rows.length > 0) {
      this.logger.log(`${rows.length} approved law(s) detected this week`);
    }
    return { found: rows.length };
  }
}
