import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CamaraApiClient } from '../ingestion/camara-api.client';
import { DeputyRepository } from '../core/repositories/deputy.repository';
import { CeapRepository } from './ceap.repository';

@Injectable()
export class CeapIngestion {
  private readonly logger = new Logger(CeapIngestion.name);
  private running = false;

  constructor(
    private readonly api: CamaraApiClient,
    private readonly deputies: DeputyRepository,
    private readonly repo: CeapRepository,
  ) {}

  /** Sincroniza CEAP do ano corrente + ano anterior — roda mensalmente. */
  @Cron(process.env.CEAP_CRON ?? '0 4 1 * *')
  async syncRecent() {
    const anoInicio = new Date().getFullYear() - 1;
    return this.sync(anoInicio);
  }

  /** Backfill histórico desde 2003 (primeiro mandato) — admin-triggered. */
  async syncHistorical() {
    return this.sync(2003);
  }

  async sync(anoInicio: number): Promise<{ inserted: number; errors: number }> {
    if (this.running) {
      this.logger.warn('CEAP ingestion already running — skipping');
      return { inserted: 0, errors: 0 };
    }
    this.running = true;

    const externalId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    const deputy = await this.deputies.findByExternalId(externalId);
    if (!deputy) {
      this.logger.warn(`Deputy external_id=${externalId} not found — run ingest first`);
      this.running = false;
      return { inserted: 0, errors: 0 };
    }

    let inserted = 0;
    let errors = 0;

    try {
      this.logger.log(`CEAP sync start: externalId=${externalId} anoInicio=${anoInicio}`);
      for await (const item of this.api.iterDeputyExpenses(externalId, anoInicio)) {
        try {
          await this.repo.upsert(deputy.id, item);
          inserted++;
        } catch (e: any) {
          this.logger.warn(`CEAP upsert failed: ${e.message}`);
          errors++;
        }
      }
    } finally {
      this.running = false;
    }

    this.logger.log(`CEAP sync done — ${inserted} upserted, ${errors} errors`);
    return { inserted, errors };
  }
}
