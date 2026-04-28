import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { NlpModule } from '../nlp/nlp.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { CamaraApiClient } from './camara-api.client';
import { IngestionService } from './ingestion.service';
import { IngestionScheduler } from './ingestion.scheduler';
import { IngestionQueue } from './ingestion.queue';
import { EventBus } from '../../shared/event-bus';

@Module({
  imports: [CoreModule, NlpModule, CommissionsModule],
  providers: [
    CamaraApiClient,
    IngestionService,
    IngestionScheduler,
    IngestionQueue,
    EventBus,
  ],
  exports: [IngestionService, IngestionQueue],
})
export class IngestionModule {}
