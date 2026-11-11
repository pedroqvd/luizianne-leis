import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { IngestionModule } from '../ingestion/ingestion.module';
import { NlpModule } from '../nlp/nlp.module';
import { EditaisModule } from '../editais/editais.module';
import { EmendasOrcModule } from '../emendas-orc/emendas-orc.module';
import { CeapModule } from '../ceap/ceap.module';
import { DiscursosModule } from '../discursos/discursos.module';
import { FrentesModule } from '../frentes/frentes.module';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [
    IngestionModule,
    NlpModule,
    EditaisModule,
    EmendasOrcModule,
    CeapModule,
    DiscursosModule,
    FrentesModule,
  ],
  controllers: [AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}
