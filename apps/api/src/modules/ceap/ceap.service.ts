import { Injectable } from '@nestjs/common';
import { CeapRepository, CeapFilter } from './ceap.repository';
import { CacheService } from '../../infra/cache/cache.service';

@Injectable()
export class CeapService {
  constructor(
    private readonly repo: CeapRepository,
    private readonly cache: CacheService,
  ) {}

  list(filter: CeapFilter) {
    const key = `ceap:list:${JSON.stringify(filter)}`;
    return this.cache.wrap(key, 120, () => this.repo.list(filter));
  }

  stats() {
    return this.cache.wrap('ceap:stats', 600, () => this.repo.stats());
  }

  byYear() {
    return this.cache.wrap('ceap:byYear', 600, () => this.repo.byYear());
  }

  byTipo() {
    return this.cache.wrap('ceap:byTipo', 600, () => this.repo.byTipo());
  }
}
