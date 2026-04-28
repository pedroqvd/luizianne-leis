import { Injectable } from '@nestjs/common';
import { PropositionRepository } from '../repositories/proposition.repository';
import { DeputyService } from './deputy.service';
import { AuthorRole } from '../../../shared/types';

@Injectable()
export class ActivityService {
  constructor(
    private readonly props: PropositionRepository,
    private readonly deputy: DeputyService,
  ) {}

  private async deputyId(): Promise<number> {
    const d = await this.deputy.getTarget();
    return d.id;
  }

  async byRole(role: AuthorRole, limit = 100) {
    return this.props.listByDeputy(await this.deputyId(), role, limit);
  }
}
