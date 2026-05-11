import { Injectable } from '@nestjs/common';
import { DiscursosRepository, DiscursosFilter } from './discursos.repository';
import { CacheService } from '../../infra/cache/cache.service';

@Injectable()
export class DiscursosService {
  constructor(
    private readonly repo: DiscursosRepository,
    private readonly cache: CacheService,
  ) {}

  list(filter: DiscursosFilter) {
    const key = `discursos:list:${JSON.stringify(filter)}`;
    return this.cache.wrap(key, 120, () => this.repo.list(filter));
  }

  stats() {
    return this.cache.wrap('discursos:stats', 600, () => this.repo.stats());
  }

  byYear() {
    return this.cache.wrap('discursos:byYear', 600, () => this.repo.byYear());
  }

  byTipo() {
    return this.cache.wrap('discursos:byTipo', 600, () => this.repo.byTipo());
  }
}
