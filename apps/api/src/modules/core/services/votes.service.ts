import { Injectable } from '@nestjs/common';
import { VoteRepository } from '../repositories/vote.repository';

@Injectable()
export class VotesService {
  constructor(private readonly repo: VoteRepository) {}

  list(limit = 100, offset = 0, absencesOnly = false) {
    return this.repo.list(limit, offset, absencesOnly);
  }

  byProposition(propositionId: number) {
    return this.repo.listByProposition(propositionId);
  }

  stats(deputyId: number) {
    return this.repo.stats(deputyId);
  }
}
