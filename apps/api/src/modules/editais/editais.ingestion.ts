import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PncpApiClient, pncpToInternal } from './pncp-api.client';
import { EditaisRepository } from './editais.repository';
import { CacheService } from '../../infra/cache/cache.service';

/**
 * Ingere editais federais abertos do PNCP.
 * Roda a cada 6 horas por padrão (EDITAIS_CRON env).
 */
@Injectable()
export class EditaisIngestion {
  private readonly logger = new Logger(EditaisIngestion.name);
  private running = false;

  constructor(
    private readonly pncp: PncpApiClient,
    private readonly repo: EditaisRepository,
    private readonly cache: CacheService,
  ) {}

  @Cron(process.env.EDITAIS_CRON ?? '0 */6 * * *')
  async run() {
    if (this.running) {
      this.logger.warn('editais ingestion already running, skipping');
      return;
    }
    this.running = true;
    try {
      await this.ingest();
    } finally {
      this.running = false;
    }
  }

  async ingest(): Promise<{ upserted: number }> {
    this.logger.log('starting editais ingestion from PNCP');
    let upserted = 0;

    for await (const item of this.pncp.iterFederalOpen()) {
      try {
        const row = pncpToInternal(item);
        await this.repo.upsert(row);
        upserted++;
      } catch (e: any) {
        this.logger.warn(`failed to upsert ${item.numeroControlePNCP}: ${e.message}`);
      }
    }

    await this.cache.invalidate('editais:*');
    this.logger.log(`editais ingestion done: ${upserted} upserted`);
    return { upserted };
  }
}
