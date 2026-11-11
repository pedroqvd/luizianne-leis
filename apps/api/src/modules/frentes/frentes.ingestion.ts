import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CamaraApiClient } from '../ingestion/camara-api.client';
import { DeputyRepository } from '../core/repositories/deputy.repository';
import { FrentesRepository } from './frentes.repository';
import { CacheService } from '../../infra/cache/cache.service';

@Injectable()
export class FrentesIngestion {
  private readonly logger = new Logger(FrentesIngestion.name);
  private running = false;

  constructor(
    private readonly api: CamaraApiClient,
    private readonly deputies: DeputyRepository,
    private readonly repo: FrentesRepository,
    private readonly cache: CacheService,
  ) {}

  // Weekly on Saturdays at 04:00
  @Cron(process.env.FRENTES_CRON ?? '0 4 * * 6')
  async tick() {
    this.logger.log('frentes sync started (scheduled)');
    try {
      await this.sync();
    } catch (e: any) {
      this.logger.error(`frentes sync failed: ${e.message}`);
    }
  }

  async sync() {
    if (this.running) {
      this.logger.warn('Frentes ingestion already running — skipping');
      return { synced: 0 };
    }
    this.running = true;

    try {
      const externalId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
      const deputy = await this.deputies.findByExternalId(externalId);
      if (!deputy) {
        this.logger.warn(`deputy ${externalId} not found — skipping frentes sync`);
        return { synced: 0 };
      }

      const fronts = await this.api.getDeputyFronts(externalId);
      this.logger.log(`frentes: ${fronts.length} found for deputy ${externalId}`);

      let synced = 0;
      for (const front of fronts) {
        if (!front?.id) continue;

        const detail = await this.api.getFrenteDetail(front.id);
        const stored = await this.repo.upsertFrente({
          external_id: front.id,
          titulo: detail?.titulo ?? front.titulo ?? `Frente #${front.id}`,
          keywords: detail?.keywords ?? null,
          id_legislatura: detail?.idLegislatura ?? front.idLegislatura ?? null,
          url_website: detail?.urlWebsite ?? null,
          payload: detail ?? front,
        });

        let role: string | null = null;
        try {
          const members = await this.api.getFrenteMembers(front.id);
          const mine = members.find((m) => m.id === externalId);
          role = mine?.titulo ?? null;
        } catch {
          // not critical — membership exists even without role
        }

        await this.repo.upsertMembro({
          deputy_id: deputy.id,
          frente_id: stored.id,
          role,
          payload: { frenteId: front.id },
        });
        synced++;
      }

      await this.cache.invalidate('frentes:*');
      this.logger.log(`frentes sync done: ${synced} upserted`);
      return { synced };
    } finally {
      this.running = false;
    }
  }
}
