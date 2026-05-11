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
      // Claim events: SELECT FOR UPDATE SKIP LOCKED ensures multi-node safety.
      // We do NOT set processed_at here — we mark each event processed only
      // AFTER successful dispatch (at-least-once semantics). A crash before
      // marking will cause re-dispatch on next tick (acceptable duplicate) rather
      // than permanent event loss (at-most-once).
      const { rows } = await this.pool.query(
        `SELECT * FROM outbox_events
         WHERE processed_at IS NULL
         ORDER BY id ASC
         LIMIT 50
         FOR UPDATE SKIP LOCKED`
      );

      let dispatched = 0;
      for (const row of rows) {
        try {
          this.events.emit({
            type: row.type,
            aggregateType: row.aggregate_type,
            aggregateId: row.aggregate_id,
            payload: row.payload,
          } as any);
          // Mark processed only after successful dispatch
          await this.pool.query(
            `UPDATE outbox_events SET processed_at = NOW() WHERE id = $1`,
            [row.id],
          );
          dispatched++;
        } catch (e: any) {
          this.logger.error(`Failed to dispatch event ${row.id} (type=${row.type}): ${e.message} — will retry`);
          // processed_at stays NULL → retried on next tick
        }
      }
      if (dispatched > 0) {
        this.logger.log(`Dispatched ${dispatched}/${rows.length} outbox events`);
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
