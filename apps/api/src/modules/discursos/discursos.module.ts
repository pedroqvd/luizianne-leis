import { Module } from '@nestjs/common';
import { CamaraApiClient } from '../ingestion/camara-api.client';
import { DeputyRepository } from '../core/repositories/deputy.repository';
import { DiscursosRepository } from './discursos.repository';
import { DiscursosService } from './discursos.service';
import { DiscursosIngestion } from './discursos.ingestion';
import { DiscursosController } from './discursos.controller';

@Module({
  controllers: [DiscursosController],
  providers: [CamaraApiClient, DeputyRepository, DiscursosRepository, DiscursosService, DiscursosIngestion],
  exports: [DiscursosService, DiscursosIngestion],
})
export class DiscursosModule {}
