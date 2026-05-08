import { Injectable } from '@nestjs/common';
import { VoteRepository } from '../repositories/vote.repository';
import { DeputyService } from './deputy.service';

@Injectable()
export class VotesService {
  constructor(
    private readonly repo: VoteRepository,
    private readonly deputy: DeputyService,
  ) {}

  async list(limit = 100, offset = 0, absencesOnly = false) {
    const d = await this.deputy.getTarget();
    return this.repo.list(d.id, limit, offset, absencesOnly);
  }

  byProposition(propositionId: number) {
    return this.repo.listByProposition(propositionId);
  }

  async statsTarget() {
    const d = await this.deputy.getTarget();
    return this.repo.stats(d.id);
  }

  stats(deputyId: number) {
    return this.repo.stats(deputyId);
  }
}
