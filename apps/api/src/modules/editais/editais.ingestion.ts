import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PncpApiClient, pncpToInternal } from './pncp-api.client';
import { EditaisRepository } from './editais.repository';
import { EditaisMatchingService } from './editais-matching.service';
import { CacheService } from '../../infra/cache/cache.service';

/**
 * Ingere editais federais e do Ceará abertos no PNCP, expira editais vencidos
 * e recalcula o traqueamento automático (matchmaking) com prefeitos e demandas.
 * Roda a cada 6 horas por padrão (EDITAIS_CRON env).
 */
@Injectable()
export class EditaisIngestion {
  private readonly logger = new Logger(EditaisIngestion.name);
  private running = false;

  constructor(
    private readonly pncp: PncpApiClient,
    private readonly repo: EditaisRepository,
    private readonly matching: EditaisMatchingService,
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

  async ingest(): Promise<{ upserted: number; expired: number; matchesUpserted: number }> {
    this.logger.log('starting editais ingestion from PNCP');

    const expired = await this.repo.expirePastDueEditais();
    if (expired > 0) {
      this.logger.log(`expired ${expired} past-due editais`);
    }

    let upserted = 0;
    const batch: Record<string, any>[] = [];

    const flushBatch = async () => {
      if (!batch.length) return;
      const items = batch.splice(0, batch.length);
      try {
        upserted += await this.repo.upsertBatch(items);
      } catch (e: any) {
        this.logger.warn(`batch upsert failed (${e.message}), falling back to row-by-row`);
        for (const row of items) {
          try {
            await this.repo.upsert(row);
            upserted++;
          } catch (rowErr: any) {
            this.logger.warn(`failed to upsert ${row.pncp_id}: ${rowErr.message}`);
          }
        }
      }
    };

    for await (const item of this.pncp.iterFederalOpen()) {
      try {
        batch.push(pncpToInternal(item));
        if (batch.length >= 50) {
          await flushBatch();
        }
      } catch (e: any) {
        this.logger.warn(`failed to parse ${item.numeroControlePNCP}: ${e.message}`);
      }
    }
    await flushBatch();

    let matchesUpserted = 0;
    try {
      const matchRes = await this.matching.recomputeMatches();
      matchesUpserted = matchRes.matchesUpserted;
    } catch (e: any) {
      this.logger.warn(`failed to recompute matches after ingestion: ${e.message}`);
    }

    await this.cache.invalidate('editais:*');
    this.logger.log(
      `editais ingestion done: ${upserted} upserted, ${expired} expired, ${matchesUpserted} matches`,
    );
    return { upserted, expired, matchesUpserted };
  }
}
