import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { DiscursosRepository } from './discursos.repository';
import { DiscursosService } from './discursos.service';
import { DiscursosIngestion } from './discursos.ingestion';
import { DiscursosController } from './discursos.controller';

@Module({
  imports: [CoreModule, IngestionModule],
  controllers: [DiscursosController],
  providers: [DiscursosRepository, DiscursosService, DiscursosIngestion],
  exports: [DiscursosService, DiscursosIngestion],
})
export class DiscursosModule {}
