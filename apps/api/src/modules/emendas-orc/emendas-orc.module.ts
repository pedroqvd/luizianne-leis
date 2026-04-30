import { Module } from '@nestjs/common';
import { TransparenciaApiClient } from './transparencia-api.client';
import { EmendasOrcRepository } from './emendas-orc.repository';
import { EmendasOrcService } from './emendas-orc.service';
import { EmendasOrcController } from './emendas-orc.controller';
import { EmendasOrcIngestion } from './emendas-orc.ingestion';

@Module({
  controllers: [EmendasOrcController],
  providers: [
    TransparenciaApiClient,
    EmendasOrcRepository,
    EmendasOrcService,
    EmendasOrcIngestion,
  ],
  exports: [EmendasOrcService, EmendasOrcIngestion],
})
export class EmendasOrcModule {}
