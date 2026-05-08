import { Injectable, NotFoundException } from '@nestjs/common';
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
      const deputy = await this.repo.findByExternalId(externalId);
      if (!deputy) throw new NotFoundException('Deputada não encontrada — rode o seed/ingestão');
      return deputy;
    });
  }
}
