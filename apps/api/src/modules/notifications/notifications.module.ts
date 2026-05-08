import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsListener } from './notifications.listener';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from './email.service';
import { OutboxWorker } from './outbox.worker';

import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsListener, NotificationsGateway, EmailService, OutboxWorker],
  exports: [EmailService],
})
export class NotificationsModule {}
