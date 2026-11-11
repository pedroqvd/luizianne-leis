import {
  BadRequestException,
  Controller,
  HttpCode,
  Post,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../infra/auth/public.decorator';
import { IngestionQueue } from '../ingestion/ingestion.queue';
import { AbsenceTrackerService } from '../ingestion/absence-tracker.service';
import { LawsAlertService } from '../ingestion/laws-alert.service';
import { ClassifierService } from '../nlp/classifier.service';
import { EditaisIngestion } from '../editais/editais.ingestion';
import { EmendasOrcIngestion } from '../emendas-orc/emendas-orc.ingestion';
import { AdminGuard } from './admin.guard';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function assertValidIsoDate(val: string | undefined, paramName: string): void {
  if (!val) return;
  if (!ISO_DATE_RE.test(val) || Number.isNaN(Date.parse(val))) {
    throw new BadRequestException(`Parâmetro '${paramName}' inválido. Use o formato YYYY-MM-DD.`);
  }
}

@ApiTags('admin')
@Public()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

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
    const parsedDays = days ? Number(days) : 7;
    const safeDays = Number.isFinite(parsedDays) ? Math.min(Math.max(Math.floor(parsedDays), 1), 365) : 7;
    const result = await this.absence.checkRecentAbsences(safeDays);
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
    assertValidIsoDate(from, 'from');
    assertValidIsoDate(to, 'to');

    this.absence.checkAllHistoricalAbsences(from, to).catch((err) => {
      this.logger.error(`Historical absence backfill failed: ${err.message}`, err.stack);
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
