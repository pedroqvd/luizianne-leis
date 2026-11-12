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

    let client: import('pg').PoolClient | null = null;
    try {
      client = await this.pool.connect();
      // Wrap in a transaction so FOR UPDATE SKIP LOCKED holds the row locks
      // until COMMIT, preventing concurrent workers from claiming the same events.
      await client.query('BEGIN');
      let rows: any[] = [];
      try {
        const res = await client.query(
          `SELECT * FROM outbox_events
           WHERE processed_at IS NULL
             AND (attempts IS NULL OR attempts < 5)
           ORDER BY id ASC
           LIMIT 50
           FOR UPDATE SKIP LOCKED`,
        );
        rows = res.rows;
      } catch (err: any) {
        if (err.code === '42703') {
          // Pre-migration 023 fallback if attempts column does not exist yet
          const res = await client.query(
            `SELECT * FROM outbox_events
             WHERE processed_at IS NULL
             ORDER BY id ASC
             LIMIT 50
             FOR UPDATE SKIP LOCKED`,
          );
          rows = res.rows;
        } else {
          throw err;
        }
      }

      let dispatched = 0;
      for (const row of rows) {
        try {
          await this.events.emit({
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
          const nextAttempt = (row.attempts || 0) + 1;
          const errMsg = String(e.message || e).slice(0, 500);
          if (nextAttempt >= 5) {
            this.logger.warn(`Event ${row.id} (type=${row.type}) reached 5 failed attempts — moving to dead-letter: ${errMsg}`);
          } else {
            this.logger.error(`Failed to dispatch event ${row.id} (type=${row.type}, attempt=${nextAttempt}/5): ${errMsg}`);
          }
          await client.query(
            `UPDATE outbox_events
             SET attempts = COALESCE(attempts, 0) + 1,
                 last_error = $2
             WHERE id = $1`,
            [row.id, errMsg],
          ).catch(() => undefined);
        }
      }
      await client.query('COMMIT');
      if (dispatched > 0) {
        this.logger.log(`Dispatched ${dispatched}/${rows.length} outbox events`);
      }
    } catch (e: any) {
      if (client) {
        await client.query('ROLLBACK').catch(() => undefined);
      }
      // Silently ignore if table doesn't exist yet (pre-migration 013)
      if (e.message?.includes('outbox_events') && e.code === '42P01') return;
      this.logger.warn(`Outbox worker error: ${e.message || e.code || 'database connection error'}`);
    } finally {
      client?.release();
      this.isProcessing = false;
    }
  }
}
