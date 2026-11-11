import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';
import { IngestionQueue } from './ingestion.queue';
import { AbsenceTrackerService } from './absence-tracker.service';
import { LawsAlertService } from './laws-alert.service';

@Injectable()
export class IngestionScheduler {
  private readonly logger = new Logger(IngestionScheduler.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly queue: IngestionQueue,
    private readonly absence: AbsenceTrackerService,
    private readonly laws: LawsAlertService,
  ) {}

  @Cron(process.env.INGESTION_CRON ?? '0 6,18 * * *')
  async tick() {
    this.logger.log('cron tick — enqueue full sync');
    await this.queue.enqueueFullSync();
  }

  @Cron(process.env.ABSENCE_CRON ?? '0 20 * * *')
  async absenceTick() {
    this.logger.log('cron tick — checking absences in nominal votes');
    try {
      const result = await this.absence.checkRecentAbsences(3);
      this.logger.log(`absence check: ${result.checked} votações, ${result.absences} ausências`);
    } catch (e: any) {
      this.logger.error(`absence check failed: ${e.message}`);
    }
  }

  @Cron(process.env.LAWS_ALERT_CRON ?? '0 9 * * 1')
  async lawsAlertTick() {
    this.logger.log('cron tick — checking approved laws');
    try {
      const result = await this.laws.checkApprovedLaws();
      this.logger.log(`laws alert: ${result.found} aprovadas encontradas`);
    } catch (e: any) {
      this.logger.error(`laws alert failed: ${e.message}`);
    }
  }

  /** Limpeza diária de eventos antigos (system_events > 90d, outbox_events processados > 30d) */
  @Cron('0 2 * * *')
  async purgeOldEventsTick() {
    try {
      const { rows } = await this.pool.query('SELECT purge_old_events(90) AS purged');
      const purged = rows[0]?.purged ?? 0;
      if (purged > 0) {
        this.logger.log(`purged ${purged} old event rows`);
      }
    } catch (e: any) {
      this.logger.warn(`purgeOldEventsTick failed: ${e.message}`);
    }
  }
}
