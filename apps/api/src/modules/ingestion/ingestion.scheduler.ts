import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IngestionQueue } from './ingestion.queue';

@Injectable()
export class IngestionScheduler {
  private readonly logger = new Logger(IngestionScheduler.name);

  constructor(private readonly queue: IngestionQueue) {}

  @Cron(process.env.INGESTION_CRON ?? CronExpression.EVERY_30_MINUTES)
  async tick() {
    this.logger.log('cron tick — enqueue full sync');
    await this.queue.enqueueFullSync();
  }
}
