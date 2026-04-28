import { Injectable, NotFoundException } from '@nestjs/common';
import { PropositionRepository, PropositionFilter } from '../repositories/proposition.repository';
import { CacheService } from '../../../infra/cache/cache.service';

@Injectable()
export class PropositionsService {
  constructor(
    private readonly repo: PropositionRepository,
    private readonly cache: CacheService,
  ) {}

  async list(filter: PropositionFilter) {
    const key = `propositions:list:${JSON.stringify(filter)}`;
    return this.cache.wrap(key, 60, () => this.repo.list(filter));
  }

  async getById(id: number) {
    const proposition = await this.repo.findById(id);
    if (!proposition) throw new NotFoundException('Proposição não encontrada');
    const [authors, proceedings] = await Promise.all([
      this.repo.listAuthors(id),
      this.repo.listProceedings(id),
    ]);
    return { ...proposition, authors, proceedings };
  }
}
