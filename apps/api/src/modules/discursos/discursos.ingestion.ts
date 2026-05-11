import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CamaraApiClient } from '../ingestion/camara-api.client';
import { DeputyRepository } from '../core/repositories/deputy.repository';
import { DiscursosRepository } from './discursos.repository';

@Injectable()
export class DiscursosIngestion {
  private readonly logger = new Logger(DiscursosIngestion.name);
  private running = false;

  constructor(
    private readonly api: CamaraApiClient,
    private readonly deputies: DeputyRepository,
    private readonly repo: DiscursosRepository,
  ) {}

  /** Sincroniza discursos recentes (último ano). Roda toda semana. */
  @Cron(process.env.DISCURSOS_CRON ?? '0 3 * * 0')
  async syncRecent() {
    const dataInicio = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return this.sync(dataInicio);
  }

  /** Backfill histórico desde 2015 — admin-triggered. */
  async syncHistorical() {
    return this.sync(process.env.INGEST_DATA_INICIO ?? '2015-02-01');
  }

  async sync(dataInicio: string): Promise<{ inserted: number; errors: number }> {
    if (this.running) {
      this.logger.warn('Discursos ingestion already running — skipping');
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
      this.logger.log(`Discursos sync start: externalId=${externalId} dataInicio=${dataInicio}`);
      for await (const item of this.api.iterDeputySpeeches(externalId, dataInicio)) {
        try {
          await this.repo.upsert(deputy.id, item);
          inserted++;
        } catch (e: any) {
          this.logger.warn(`Discurso upsert failed: ${e.message}`);
          errors++;
        }
      }
    } finally {
      this.running = false;
    }

    this.logger.log(`Discursos sync done — ${inserted} upserted, ${errors} errors`);
    return { inserted, errors };
  }
}
