import { Injectable } from '@nestjs/common';
import { CommissionsRepository } from './commissions.repository';

@Injectable()
export class CommissionsService {
  constructor(private readonly repo: CommissionsRepository) {}

  list() {
    return this.repo.list();
  }

  forDeputy(deputyId: number) {
    return this.repo.listForDeputy(deputyId);
  }

  forTarget() {
    return this.repo.listForTarget();
  }
}
