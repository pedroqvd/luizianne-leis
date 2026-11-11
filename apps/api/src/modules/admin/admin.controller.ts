import {
  BadRequestException,
  Controller,
  HttpCode,
  Inject,
  OnApplicationBootstrap,
  Post,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';
import { Public } from '../../infra/auth/public.decorator';
import { IngestionQueue } from '../ingestion/ingestion.queue';
import { AbsenceTrackerService } from '../ingestion/absence-tracker.service';
import { LawsAlertService } from '../ingestion/laws-alert.service';
import { ClassifierService } from '../nlp/classifier.service';
import { EditaisIngestion } from '../editais/editais.ingestion';
import { EmendasOrcIngestion } from '../emendas-orc/emendas-orc.ingestion';
import { CeapIngestion } from '../ceap/ceap.ingestion';
import { DiscursosIngestion } from '../discursos/discursos.ingestion';
import { FrentesIngestion } from '../frentes/frentes.ingestion';
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
export class AdminController implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly queue: IngestionQueue,
    private readonly classifier: ClassifierService,
    private readonly editaisIngestion: EditaisIngestion,
    private readonly emendasIngestion: EmendasOrcIngestion,
    private readonly ceapIngestion: CeapIngestion,
    private readonly discursosIngestion: DiscursosIngestion,
    private readonly frentesIngestion: FrentesIngestion,
    private readonly absence: AbsenceTrackerService,
    private readonly laws: LawsAlertService,
  ) {}

  onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'test') return;
    setTimeout(() => {
      this.autoBootstrapEmptyDatabase().catch((err) => {
        this.logger.warn(`Auto-bootstrap check skipped: ${err.message}`);
      });
    }, 5_000);
  }

  private async autoBootstrapEmptyDatabase() {
    const { rows } = await this.pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM editais)               AS editais_cnt,
        (SELECT COUNT(*)::int FROM propositions)          AS props_cnt,
        (SELECT COUNT(*)::int FROM frentes_parlamentares) AS frentes_cnt,
        (SELECT COUNT(*)::int FROM discursos)             AS discursos_cnt,
        (SELECT COUNT(*)::int FROM ceap_despesas)         AS ceap_cnt,
        (SELECT COUNT(*)::int FROM emendas_orcamentarias) AS emendas_cnt
    `);
    const counts = rows[0] ?? {};

    if ((counts.editais_cnt ?? 0) === 0) {
      this.logger.log('[AutoBootstrap] Empty editais table — starting initial PNCP sync...');
      this.editaisIngestion.ingest().catch((e) =>
        this.logger.warn(`[AutoBootstrap] Editais sync failed: ${e.message}`),
      );
    }

    if ((counts.props_cnt ?? 0) === 0) {
      this.logger.log('[AutoBootstrap] Empty propositions table — starting initial Câmara sync...');
      this.queue.enqueueFullSync().catch((e) =>
        this.logger.warn(`[AutoBootstrap] Full sync failed: ${e.message}`),
      );
    }

    if ((counts.frentes_cnt ?? 0) === 0) {
      this.logger.log('[AutoBootstrap] Empty frentes_parlamentares table — starting initial sync...');
      this.frentesIngestion.sync().catch((e) =>
        this.logger.warn(`[AutoBootstrap] Frentes sync failed: ${e.message}`),
      );
    }

    if ((counts.discursos_cnt ?? 0) === 0) {
      this.logger.log('[AutoBootstrap] Empty discursos table — starting initial sync...');
      this.discursosIngestion.syncHistorical().catch((e) =>
        this.logger.warn(`[AutoBootstrap] Discursos sync failed: ${e.message}`),
      );
    }

    if ((counts.ceap_cnt ?? 0) === 0) {
      this.logger.log('[AutoBootstrap] Empty ceap_despesas table — starting initial sync...');
      this.ceapIngestion.syncRecent().catch((e) =>
        this.logger.warn(`[AutoBootstrap] CEAP sync failed: ${e.message}`),
      );
    }

    if ((counts.emendas_cnt ?? 0) === 0) {
      this.logger.log('[AutoBootstrap] Empty emendas_orcamentarias table — starting initial sync...');
      this.emendasIngestion.ingest().catch((e) =>
        this.logger.warn(`[AutoBootstrap] Emendas sync failed: ${e.message}`),
      );
    }
  }

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
