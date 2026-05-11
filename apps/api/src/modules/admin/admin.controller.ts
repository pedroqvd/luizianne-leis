import { Controller, Headers, HttpCode, Post, Query, Logger, UseGuards } from '@nestjs/common';

function formatDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../infra/auth/public.decorator';
import { IngestionQueue } from '../ingestion/ingestion.queue';
import { AbsenceTrackerService } from '../ingestion/absence-tracker.service';
import { LawsAlertService } from '../ingestion/laws-alert.service';
import { ClassifierService } from '../nlp/classifier.service';
import { EditaisIngestion } from '../editais/editais.ingestion';
import { EmendasOrcIngestion } from '../emendas-orc/emendas-orc.ingestion';
import { AdminGuard } from './admin.guard';

@ApiTags('admin')
@Public()
@UseGuards(AdminGuard)
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
  async triggerIngest() {
    const job = await this.queue.enqueueFullSync();
    return { enqueued: true, jobId: job.id };
  }

  @Post('reclassify')
  async reclassify(@Query('force') force?: string) {
    return this.classifier.reclassifyAll(force === 'true');
  }

  @Post('ingest-editais')
  async triggerEditais() {
    const result = await this.editaisIngestion.ingest();
    return { ok: true, ...result };
  }

  @Post('ingest-emendas-orc')
  async triggerEmendasOrc() {
    const result = await this.emendasIngestion.ingest();
    return { ok: true, ...result };
  }

  @Post('check-absences')
  async triggerAbsences(@Query('days') days?: string) {
    const result = await this.absence.checkRecentAbsences(days ? Number(days) : 7);
    return { ok: true, ...result };
  }

  @Post('check-absences-historical')
  @HttpCode(202)
  @ApiQuery({ name: 'from', required: false, type: String, example: '2015-02-01', description: 'Data início (padrão: INGEST_DATA_INICIO)' })
  @ApiQuery({ name: 'to',   required: false, type: String, example: '2026-12-31', description: 'Data fim (padrão: hoje)' })
  async triggerHistoricalAbsences(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.absence.checkAllHistoricalAbsences(from, to).catch((err) => {
      const logger = new Logger('AdminController');
      logger.error(`Historical absence backfill failed: ${err.message}`, err.stack);
    });
    return {
      ok: true,
      message: 'Historical absence backfill started in background. Check server logs for progress.',
      from: from ?? process.env.INGEST_DATA_INICIO ?? '2015-02-01',
      to: to ?? new Date().toISOString().slice(0, 10),
    };
  }

  @Post('check-laws')
  async triggerLawsAlert() {
    const result = await this.laws.checkApprovedLaws();
    return { ok: true, ...result };
  }
}
