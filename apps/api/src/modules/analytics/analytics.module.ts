import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { CoreModule } from '../core/core.module';
import { NlpModule } from '../nlp/nlp.module';

@Module({
  imports: [CoreModule, NlpModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
