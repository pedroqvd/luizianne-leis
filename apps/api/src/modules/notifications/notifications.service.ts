import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';
import { DomainEvent } from '../../shared/event-bus';

@Injectable()
export class NotificationsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async record(event: DomainEvent): Promise<void> {
    await this.pool.query(
      `INSERT INTO system_events (type, aggregate_type, aggregate_id, payload)
       VALUES ($1, $2, $3, $4)`,
      [event.type, event.aggregateType, event.aggregateId, event.payload],
    );
  }

  async list(limit = 50) {
    const { rows } = await this.pool.query(
      `SELECT id, type, aggregate_type, aggregate_id, payload, created_at
         FROM system_events
         ORDER BY created_at DESC
         LIMIT $1`,
      [limit],
    );
    return rows;
  }
}
