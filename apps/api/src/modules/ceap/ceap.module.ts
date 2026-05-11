import { Module } from '@nestjs/common';
import { CamaraApiClient } from '../ingestion/camara-api.client';
import { DeputyRepository } from '../core/repositories/deputy.repository';
import { CeapRepository } from './ceap.repository';
import { CeapService } from './ceap.service';
import { CeapIngestion } from './ceap.ingestion';
import { CeapController } from './ceap.controller';

@Module({
  controllers: [CeapController],
  providers: [CamaraApiClient, DeputyRepository, CeapRepository, CeapService, CeapIngestion],
  exports: [CeapService, CeapIngestion],
})
export class CeapModule {}
