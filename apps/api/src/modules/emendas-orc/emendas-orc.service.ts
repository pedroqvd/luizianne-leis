import { Injectable } from '@nestjs/common';
import { EmendasOrcRepository, EmendasOrcFilter } from './emendas-orc.repository';
import { CacheService } from '../../infra/cache/cache.service';

@Injectable()
export class EmendasOrcService {
  constructor(
    private readonly repo: EmendasOrcRepository,
    private readonly cache: CacheService,
  ) {}

  list(filter: EmendasOrcFilter) {
    const key = `emendas-orc:list:${JSON.stringify(filter)}`;
    return this.cache.wrap(key, 300, () => this.repo.list(filter));
  }

  findById(id: number) {
    return this.cache.wrap(`emendas-orc:id:${id}`, 600, () => this.repo.findById(id));
  }

  stats() {
    return this.cache.wrap('emendas-orc:stats', 600, () => this.repo.stats());
  }

  byYear() {
    return this.cache.wrap('emendas-orc:byYear', 600, () => this.repo.byYear());
  }

  byFuncao() {
    return this.cache.wrap('emendas-orc:byFuncao', 600, () => this.repo.byFuncao());
  }

  byUf() {
    return this.cache.wrap('emendas-orc:byUf', 600, () => this.repo.byUf());
  }
}
