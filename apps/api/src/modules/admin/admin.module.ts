import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { IngestionModule } from '../ingestion/ingestion.module';
import { NlpModule } from '../nlp/nlp.module';

@Module({
  imports: [IngestionModule, NlpModule],
  controllers: [AdminController],
})
export class AdminModule {}
