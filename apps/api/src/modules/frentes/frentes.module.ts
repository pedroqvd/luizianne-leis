import { Module } from '@nestjs/common';
import { CamaraApiClient } from '../ingestion/camara-api.client';
import { DeputyRepository } from '../core/repositories/deputy.repository';
import { FrentesRepository } from './frentes.repository';
import { FrentesService } from './frentes.service';
import { FrentesIngestion } from './frentes.ingestion';
import { FrentesController } from './frentes.controller';

@Module({
  controllers: [FrentesController],
  providers: [CamaraApiClient, DeputyRepository, FrentesRepository, FrentesService, FrentesIngestion],
  exports: [FrentesService, FrentesIngestion],
})
export class FrentesModule {}
