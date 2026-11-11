import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { FrentesRepository } from './frentes.repository';
import { FrentesService } from './frentes.service';
import { FrentesIngestion } from './frentes.ingestion';
import { FrentesController } from './frentes.controller';

@Module({
  imports: [CoreModule, IngestionModule],
  controllers: [FrentesController],
  providers: [FrentesRepository, FrentesService, FrentesIngestion],
  exports: [FrentesService, FrentesIngestion],
})
export class FrentesModule {}
