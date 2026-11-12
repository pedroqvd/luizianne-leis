import { Injectable } from '@nestjs/common';
import { VoteRepository } from '../repositories/vote.repository';
import { DeputyService } from './deputy.service';
import { CacheService } from '../../../infra/cache/cache.service';

@Injectable()
export class VotesService {
  constructor(
    private readonly repo: VoteRepository,
    private readonly deputy: DeputyService,
    private readonly cache: CacheService,
  ) {}

  async list(limit = 100, offset = 0, absencesOnly = false) {
    const d = await this.deputy.getTarget();
    const key = `votes:list:${d.id}:${limit}:${offset}:${absencesOnly}`;
    return this.cache.wrap(key, 60, () =>
      this.repo.list(d.id, limit, offset, absencesOnly),
    );
  }

  byProposition(propositionId: number) {
    return this.repo.listByProposition(propositionId);
  }

  async statsTarget() {
    const d = await this.deputy.getTarget();
    return this.cache.wrap(`votes:stats:${d.id}`, 300, () =>
      this.repo.stats(d.id),
    );
  }

  stats(deputyId: number) {
    return this.repo.stats(deputyId);
  }
}
