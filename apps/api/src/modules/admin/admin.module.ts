import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { IngestionModule } from '../ingestion/ingestion.module';
import { NlpModule } from '../nlp/nlp.module';
import { EditaisModule } from '../editais/editais.module';

@Module({
  imports: [IngestionModule, NlpModule, EditaisModule],
  controllers: [AdminController],
})
export class AdminModule {}
