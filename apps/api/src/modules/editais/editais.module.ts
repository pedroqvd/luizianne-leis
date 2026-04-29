import { Module } from '@nestjs/common';
import { PncpApiClient } from './pncp-api.client';
import { EditaisRepository } from './editais.repository';
import { EditaisService } from './editais.service';
import { EditaisController } from './editais.controller';
import { EditaisIngestion } from './editais.ingestion';
import { EditaisAlerts } from './editais.alerts';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [EditaisController],
  providers: [
    PncpApiClient,
    EditaisRepository,
    EditaisService,
    EditaisIngestion,
    EditaisAlerts,
  ],
  exports: [EditaisService, EditaisIngestion],
})
export class EditaisModule {}
