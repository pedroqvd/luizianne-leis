import { Injectable } from '@nestjs/common';
import { CommissionsRepository } from './commissions.repository';
import { CacheService } from '../../infra/cache/cache.service';

@Injectable()
export class CommissionsService {
  constructor(
    private readonly repo: CommissionsRepository,
    private readonly cache: CacheService,
  ) {}

  list() {
    return this.cache.wrap('commissions:list', 600, () => this.repo.list());
  }

  forDeputy(deputyId: number) {
    return this.cache.wrap(`commissions:deputy:${deputyId}`, 600, () =>
      this.repo.listForDeputy(deputyId),
    );
  }

  forTarget() {
    return this.cache.wrap('commissions:target', 600, () =>
      this.repo.listForTarget(),
    );
  }
}
