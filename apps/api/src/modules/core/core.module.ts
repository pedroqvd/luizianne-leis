import { Module } from '@nestjs/common';
import { DeputyController } from './controllers/deputy.controller';
import { PropositionsController } from './controllers/propositions.controller';
import { VotesController } from './controllers/votes.controller';
import { ActivityController } from './controllers/activity.controller';

import { DeputyRepository } from './repositories/deputy.repository';
import { PropositionRepository } from './repositories/proposition.repository';
import { VoteRepository } from './repositories/vote.repository';

import { DeputyService } from './services/deputy.service';
import { PropositionsService } from './services/propositions.service';
import { VotesService } from './services/votes.service';
import { ActivityService } from './services/activity.service';

@Module({
  controllers: [
    DeputyController,
    PropositionsController,
    VotesController,
    ActivityController,
  ],
  providers: [
    DeputyRepository,
    PropositionRepository,
    VoteRepository,
    DeputyService,
    PropositionsService,
    VotesService,
    ActivityService,
  ],
  exports: [
    DeputyRepository,
    PropositionRepository,
    VoteRepository,
    DeputyService,
    PropositionsService,
  ],
})
export class CoreModule {}
