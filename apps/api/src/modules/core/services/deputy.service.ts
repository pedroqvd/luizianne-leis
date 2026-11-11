import { Injectable } from '@nestjs/common';
import { DeputyRepository } from '../repositories/deputy.repository';
import { CacheService } from '../../../infra/cache/cache.service';

@Injectable()
export class DeputyService {
  constructor(
    private readonly repo: DeputyRepository,
    private readonly cache: CacheService,
  ) {}

  async getTarget() {
    const externalId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    return this.cache.wrap(`deputy:target:${externalId}`, 300, async () => {
      let deputy = await this.repo.findByExternalId(externalId);
      if (!deputy) {
        deputy = await this.repo.upsert({
          external_id: externalId,
          name: process.env.TARGET_DEPUTY_NAME ?? 'Luizianne Lins',
          party: 'PT',
          state: process.env.TARGET_DEPUTY_UF ?? 'CE',
        });
      }
      return deputy;
    });
  }
}
