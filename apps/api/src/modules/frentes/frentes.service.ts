import { Injectable } from '@nestjs/common';
import { CacheService } from '../../infra/cache/cache.service';
import { FrentesRepository } from './frentes.repository';

@Injectable()
export class FrentesService {
  constructor(
    private readonly repo: FrentesRepository,
    private readonly cache: CacheService,
  ) {}

  list() {
    return this.cache.wrap('frentes:list', 300, () => this.repo.listForTarget());
  }

  stats() {
    return this.cache.wrap('frentes:stats', 300, () => this.repo.stats());
  }
}
