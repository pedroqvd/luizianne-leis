import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';
import { EventBus } from '../../shared/event-bus';

@Injectable()
export class OutboxWorker {
  private readonly logger = new Logger(OutboxWorker.name);
  private isProcessing = false;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly events: EventBus,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutbox() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Use CTE with FOR UPDATE SKIP LOCKED to make it safe for multi-node!
      const { rows } = await this.pool.query(
        `WITH claim AS (
           SELECT id FROM outbox_events
           WHERE processed_at IS NULL
           ORDER BY id ASC
           LIMIT 50
           FOR UPDATE SKIP LOCKED
         )
         UPDATE outbox_events e
         SET processed_at = NOW()
         FROM claim c
         WHERE e.id = c.id
         RETURNING e.*`
      );

      for (const row of rows) {
        try {
          this.events.emit({
            type: row.type,
            aggregateType: row.aggregate_type,
            aggregateId: row.aggregate_id,
            payload: row.payload,
          } as any);
        } catch (e: any) {
          this.logger.error(`Failed to dispatch event ${row.id}: ${e.message}`);
        }
      }
      if (rows.length > 0) {
        this.logger.log(`Dispatched ${rows.length} outbox events`);
      }
    } catch (e: any) {
      // Silently ignore if table doesn't exist yet (pre-migration 013)
      if (e.message?.includes('outbox_events') && e.code === '42P01') return;
      this.logger.error(`Outbox worker error: ${e.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
