import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { IngestionModule } from '../ingestion/ingestion.module';
import { NlpModule } from '../nlp/nlp.module';
import { EditaisModule } from '../editais/editais.module';
import { EmendasOrcModule } from '../emendas-orc/emendas-orc.module';

@Module({
  imports: [IngestionModule, NlpModule, EditaisModule, EmendasOrcModule],
  controllers: [AdminController],
})
export class AdminModule {}
