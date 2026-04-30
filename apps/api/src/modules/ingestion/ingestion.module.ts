import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { NlpModule } from '../nlp/nlp.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CamaraApiClient } from './camara-api.client';
import { IngestionService } from './ingestion.service';
import { IngestionScheduler } from './ingestion.scheduler';
import { IngestionQueue } from './ingestion.queue';
import { AbsenceTrackerService } from './absence-tracker.service';
import { LawsAlertService } from './laws-alert.service';
import { EventBus } from '../../shared/event-bus';

@Module({
  imports: [CoreModule, NlpModule, CommissionsModule, NotificationsModule],
  providers: [
    CamaraApiClient,
    IngestionService,
    IngestionScheduler,
    IngestionQueue,
    AbsenceTrackerService,
    LawsAlertService,
    EventBus,
  ],
  exports: [IngestionService, IngestionQueue, AbsenceTrackerService, LawsAlertService],
})
export class IngestionModule {}
