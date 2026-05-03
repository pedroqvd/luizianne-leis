import { Controller, ForbiddenException, Headers, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IngestionQueue } from '../ingestion/ingestion.queue';
import { AbsenceTrackerService } from '../ingestion/absence-tracker.service';
import { LawsAlertService } from '../ingestion/laws-alert.service';
import { ClassifierService } from '../nlp/classifier.service';
import { EditaisIngestion } from '../editais/editais.ingestion';
import { EmendasOrcIngestion } from '../emendas-orc/emendas-orc.ingestion';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly queue: IngestionQueue,
    private readonly classifier: ClassifierService,
    private readonly editaisIngestion: EditaisIngestion,
    private readonly emendasIngestion: EmendasOrcIngestion,
    private readonly absence: AbsenceTrackerService,
    private readonly laws: LawsAlertService,
  ) {}

  @Post('ingest')
  async triggerIngest(@Headers('x-admin-token') token?: string) {
    this.assertAuth(token);
    const job = await this.queue.enqueueFullSync();
    return { enqueued: true, jobId: job.id };
  }

  @Post('reclassify')
  async reclassify(
    @Headers('x-admin-token') token?: string,
    @Query('force') force?: string,
  ) {
    this.assertAuth(token);
    return this.classifier.reclassifyAll(force === 'true');
  }

  @Post('ingest-editais')
  async triggerEditais(@Headers('x-admin-token') token?: string) {
    this.assertAuth(token);
    const result = await this.editaisIngestion.ingest();
    return { ok: true, ...result };
  }

  @Post('ingest-emendas-orc')
  async triggerEmendasOrc(@Headers('x-admin-token') token?: string) {
    this.assertAuth(token);
    const result = await this.emendasIngestion.ingest();
    return { ok: true, ...result };
  }

  @Post('check-absences')
  async triggerAbsences(
    @Headers('x-admin-token') token?: string,
    @Query('days') days?: string,
  ) {
    this.assertAuth(token);
    const result = await this.absence.checkRecentAbsences(days ? Number(days) : 7);
    return { ok: true, ...result };
  }

  @Post('check-laws')
  async triggerLawsAlert(@Headers('x-admin-token') token?: string) {
    this.assertAuth(token);
    const result = await this.laws.checkApprovedLaws();
    return { ok: true, ...result };
  }

  private assertAuth(token?: string) {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) throw new ForbiddenException('ADMIN_TOKEN não configurado no servidor');
    if (token !== expected) throw new ForbiddenException('token inválido');
  }
}
