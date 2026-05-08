import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsListener } from './notifications.listener';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from './email.service';
import { OutboxWorker } from './outbox.worker';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsListener, NotificationsGateway, EmailService, OutboxWorker],
  exports: [EmailService],
})
export class NotificationsModule {}
