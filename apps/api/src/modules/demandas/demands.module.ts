import { Module } from '@nestjs/common';
import { DemandsReminderService } from './demands-reminder.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [DemandsReminderService],
})
export class DemandasModule {}
