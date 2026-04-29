import { Module } from '@nestjs/common';
import { PncpApiClient } from './pncp-api.client';
import { EditaisRepository } from './editais.repository';
import { EditaisService } from './editais.service';
import { EditaisController } from './editais.controller';
import { EditaisIngestion } from './editais.ingestion';

@Module({
  controllers: [EditaisController],
  providers: [
    PncpApiClient,
    EditaisRepository,
    EditaisService,
    EditaisIngestion,
  ],
  exports: [EditaisService, EditaisIngestion],
})
export class EditaisModule {}
