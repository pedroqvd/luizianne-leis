import { Injectable } from '@nestjs/common';
import { PropositionRepository } from '../repositories/proposition.repository';
import { DeputyService } from './deputy.service';
import { AuthorRole } from '../../../shared/types';
import { CacheService } from '../../../infra/cache/cache.service';

@Injectable()
export class ActivityService {
  constructor(
    private readonly props: PropositionRepository,
    private readonly deputy: DeputyService,
    private readonly cache: CacheService,
  ) {}

  private async deputyId(): Promise<number> {
    const d = await this.deputy.getTarget();
    return d.id;
  }

  async byRole(role: AuthorRole, limit = 100) {
    const id = await this.deputyId();
    return this.cache.wrap(`activity:role:${id}:${role}:${limit}`, 300, () =>
      this.props.listByDeputy(id, role, limit),
    );
  }
}
