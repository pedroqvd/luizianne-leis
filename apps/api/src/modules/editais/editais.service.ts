import { Injectable, NotFoundException } from '@nestjs/common';
import { CacheService } from '../../infra/cache/cache.service';
import { EditaisRepository, EditalFilter } from './editais.repository';

@Injectable()
export class EditaisService {
  constructor(
    private readonly repo: EditaisRepository,
    private readonly cache: CacheService,
  ) {}

  async list(filter: EditalFilter) {
    const key = `editais:list:${JSON.stringify(filter)}`;
    return this.cache.wrap(key, 120, () => this.repo.list(filter));
  }

  async findById(id: number) {
    const edital = await this.repo.findById(id);
    if (!edital) throw new NotFoundException('Edital não encontrado');
    return edital;
  }

  async stats() {
    return this.cache.wrap('editais:stats', 300, () => this.repo.stats());
  }

  async ministries() {
    return this.cache.wrap('editais:ministries', 600, () => this.repo.ministries());
  }
}
