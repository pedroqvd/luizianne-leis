import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { CeapRepository } from './ceap.repository';
import { CeapService } from './ceap.service';
import { CeapIngestion } from './ceap.ingestion';
import { CeapController } from './ceap.controller';

@Module({
  imports: [CoreModule, IngestionModule],
  controllers: [CeapController],
  providers: [CeapRepository, CeapService, CeapIngestion],
  exports: [CeapService, CeapIngestion],
})
export class CeapModule {}
