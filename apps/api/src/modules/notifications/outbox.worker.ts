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

    const client = await this.pool.connect();
    try {
      // Wrap in a transaction so FOR UPDATE SKIP LOCKED holds the row locks
      // until COMMIT, preventing concurrent workers from claiming the same events.
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT * FROM outbox_events
         WHERE processed_at IS NULL
         ORDER BY id ASC
         LIMIT 50
         FOR UPDATE SKIP LOCKED`,
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
          // Mark processed only after successful dispatch (at-least-once semantics)
          await client.query(
            `UPDATE outbox_events SET processed_at = NOW() WHERE id = $1`,
            [row.id],
          );
          dispatched++;
        } catch (e: any) {
          this.logger.error(`Failed to dispatch event ${row.id} (type=${row.type}): ${e.message} — will retry`);
          // processed_at stays NULL → retried on next tick
        }
      }
      await client.query('COMMIT');
      if (dispatched > 0) {
        this.logger.log(`Dispatched ${dispatched}/${rows.length} outbox events`);
      }
    } catch (e: any) {
      await client.query('ROLLBACK').catch(() => undefined);
      // Silently ignore if table doesn't exist yet (pre-migration 013)
      if (e.message?.includes('outbox_events') && e.code === '42P01') return;
      this.logger.error(`Outbox worker error: ${e.message}`);
    } finally {
      client.release();
      this.isProcessing = false;
    }
  }
}
