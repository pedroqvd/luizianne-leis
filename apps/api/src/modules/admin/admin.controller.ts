import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Inject,
  OnApplicationBootstrap,
  Post,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
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
@Controller('admin')
export class AdminController implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminController.name);
  private readonly lastAttemptAt = new Map<string, number>();
  private lastStatusCache: { ts: number; data: any } | null = null;

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
      this.runSmartAutoSync('bootstrap').catch((err) => {
        this.logger.warn(`Auto-sync check skipped: ${err.message}`);
      });
    }, 3_000);
  }

  @Interval(15 * 60 * 1000)
  async scheduledSmartSync() {
    if (process.env.NODE_ENV === 'test') return;
    await this.runSmartAutoSync('interval-15m').catch((err) => {
      this.logger.warn(`Scheduled smart-sync skipped: ${err.message}`);
    });
  }

  private canTrigger(domain: string, cooldownMs: number): boolean {
    const last = this.lastAttemptAt.get(domain) ?? 0;
    if (Date.now() - last < cooldownMs) return false;
    this.lastAttemptAt.set(domain, Date.now());
    return true;
  }

  async runSmartAutoSync(source = 'manual'): Promise<{
    ok: boolean;
    source: string;
    triggered: string[];
    counts: Record<string, number>;
  }> {
    const { rows } = await this.pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM editais)               AS editais_cnt,
        (SELECT MAX(updated_at) FROM editais)             AS editais_last,
        (SELECT COUNT(*)::int FROM propositions)          AS props_cnt,
        (SELECT MAX(updated_at) FROM propositions)        AS props_last,
        (SELECT COUNT(*)::int FROM v_deputy_productivity) AS mv_cnt,
        (SELECT COUNT(*)::int FROM frentes_parlamentares) AS frentes_cnt,
        (SELECT MAX(updated_at) FROM frentes_parlamentares) AS frentes_last,
        (SELECT COUNT(*)::int FROM discursos)             AS discursos_cnt,
        (SELECT MAX(updated_at) FROM discursos)           AS discursos_last,
        (SELECT COUNT(*)::int FROM ceap_despesas)         AS ceap_cnt,
        (SELECT MAX(updated_at) FROM ceap_despesas)       AS ceap_last,
        (SELECT COUNT(*)::int FROM emendas_orcamentarias) AS emendas_cnt,
        (SELECT MAX(updated_at) FROM emendas_orcamentarias) AS emendas_last,
        (SELECT COUNT(*)::int FROM municipal_authorities WHERE role_type = 'prefeito' AND active = true) AS prefeitos_cnt
    `);
    const st = rows[0] ?? {};
    const now = Date.now();
    const ageMs = (ts: any) => (ts ? now - new Date(ts).getTime() : Number.POSITIVE_INFINITY);
    const HOUR = 3600_000;
    const triggered: string[] = [];

    // 0. Se propositions já tem dados mas v_deputy_productivity está vazia, atualiza as views na hora
    if ((st.props_cnt ?? 0) > 0 && (st.mv_cnt ?? 0) === 0 && this.canTrigger('mv_refresh', 2 * 60_000)) {
      triggered.push('materialized_views');
      Promise.all([
        this.pool.query('REFRESH MATERIALIZED VIEW v_deputy_productivity').catch(() => undefined),
        this.pool.query('REFRESH MATERIALIZED VIEW v_proposition_approval').catch(() => undefined),
        this.pool.query('REFRESH MATERIALIZED VIEW v_coauthorship_edges').catch(() => undefined),
        this.pool.query('REFRESH MATERIALIZED VIEW v_categories_breakdown').catch(() => undefined),
      ]).catch(() => undefined);
    }

    // 1. Editais PNCP (vazio ou > 6h sem atualizar)
    const editaisEmpty = (st.editais_cnt ?? 0) === 0;
    if ((editaisEmpty || ageMs(st.editais_last) > 6 * HOUR) && this.canTrigger('editais', editaisEmpty ? 3 * 60_000 : 2 * HOUR)) {
      this.logger.log(`[AutoSync:${source}] Triggering editais sync (cnt=${st.editais_cnt})...`);
      triggered.push('editais');
      this.editaisIngestion.run().catch((e) =>
        this.logger.warn(`[AutoSync] Editais sync failed: ${e.message}`),
      );
    }

    // 2. Proposições, Votações, Comissões e Ausências (vazio ou > 12h sem atualizar)
    const propsEmpty = (st.props_cnt ?? 0) === 0;
    if ((propsEmpty || ageMs(st.props_last) > 12 * HOUR) && this.canTrigger('propositions', propsEmpty ? 3 * 60_000 : 4 * HOUR)) {
      this.logger.log(`[AutoSync:${source}] Triggering Câmara full sync (cnt=${st.props_cnt})...`);
      triggered.push('propositions');
      this.queue.enqueueFullSync().catch((e) =>
        this.logger.warn(`[AutoSync] Full sync failed: ${e.message}`),
      );
      this.absence.checkRecentAbsences(14).catch(() => undefined);
      this.laws.checkApprovedLaws().catch(() => undefined);
    }

    // 3. Frentes Parlamentares (vazio ou > 7 dias sem atualizar)
    const frentesEmpty = (st.frentes_cnt ?? 0) === 0;
    if ((frentesEmpty || ageMs(st.frentes_last) > 7 * 24 * HOUR) && this.canTrigger('frentes', frentesEmpty ? 3 * 60_000 : 12 * HOUR)) {
      this.logger.log(`[AutoSync:${source}] Triggering frentes sync (cnt=${st.frentes_cnt})...`);
      triggered.push('frentes');
      this.frentesIngestion.sync().catch((e) =>
        this.logger.warn(`[AutoSync] Frentes sync failed: ${e.message}`),
      );
    }

    // 4. Discursos (vazio -> histórico desde 2015; ou > 24h -> recente)
    const discursosEmpty = (st.discursos_cnt ?? 0) === 0;
    if ((discursosEmpty || ageMs(st.discursos_last) > 24 * HOUR) && this.canTrigger('discursos', discursosEmpty ? 3 * 60_000 : 6 * HOUR)) {
      this.logger.log(`[AutoSync:${source}] Triggering discursos sync (cnt=${st.discursos_cnt})...`);
      triggered.push('discursos');
      const task = discursosEmpty
        ? this.discursosIngestion.syncHistorical()
        : this.discursosIngestion.syncRecent();
      task.catch((e) => this.logger.warn(`[AutoSync] Discursos sync failed: ${e.message}`));
    }

    // 5. CEAP Despesas (vazio -> histórico por legislaturas; ou > 24h -> recente)
    const ceapEmpty = (st.ceap_cnt ?? 0) === 0;
    if ((ceapEmpty || ageMs(st.ceap_last) > 24 * HOUR) && this.canTrigger('ceap', ceapEmpty ? 3 * 60_000 : 6 * HOUR)) {
      this.logger.log(`[AutoSync:${source}] Triggering CEAP sync (cnt=${st.ceap_cnt})...`);
      triggered.push('ceap');
      const task = ceapEmpty
        ? this.ceapIngestion.syncHistorical()
        : this.ceapIngestion.syncRecent();
      task.catch((e) => this.logger.warn(`[AutoSync] CEAP sync failed: ${e.message}`));
    }

    // 6. Emendas Orçamentárias (vazio ou > 7 dias sem atualizar)
    const emendasEmpty = (st.emendas_cnt ?? 0) === 0;
    if ((emendasEmpty || ageMs(st.emendas_last) > 7 * 24 * HOUR) && this.canTrigger('emendas', emendasEmpty ? 3 * 60_000 : 12 * HOUR)) {
      this.logger.log(`[AutoSync:${source}] Triggering Emendas sync (cnt=${st.emendas_cnt})...`);
      triggered.push('emendas');
      this.emendasIngestion.run().catch((e) =>
        this.logger.warn(`[AutoSync] Emendas sync failed: ${e.message}`),
      );
    }

    // 7. Prefeitos do Ceará (184 municípios com dados oficiais 2025-2028)
    const prefeitosEmpty = (st.prefeitos_cnt ?? 0) < 184;
    if (prefeitosEmpty && this.canTrigger('seed_mayors', 60_000)) {
      this.logger.log(`[AutoSync:${source}] Triggering 184 Ceará Mayors seeding (cnt=${st.prefeitos_cnt})...`);
      triggered.push('prefeitos');
      this.seedMayors().catch((e) =>
        this.logger.warn(`[AutoSync] Mayors seed failed: ${e.message}`),
      );
    }

    return {
      ok: true,
      source,
      triggered,
      counts: {
        editais: st.editais_cnt ?? 0,
        propositions: st.props_cnt ?? 0,
        frentes: st.frentes_cnt ?? 0,
        discursos: st.discursos_cnt ?? 0,
        ceap: st.ceap_cnt ?? 0,
        emendas: st.emendas_cnt ?? 0,
        prefeitos: st.prefeitos_cnt ?? 0,
      },
    };
  }

  @Get('auto-sync')
  async autoSyncHeartbeat(@Query('force') force?: string) {
    if (force === 'true') {
      this.lastAttemptAt.clear();
      this.lastStatusCache = null;
    }
    if (this.lastStatusCache && Date.now() - this.lastStatusCache.ts < 30_000) {
      return this.lastStatusCache.data;
    }
    const data = await this.runSmartAutoSync('heartbeat');
    this.lastStatusCache = { ts: Date.now(), data };
    return data;
  }

  @UseGuards(AdminGuard)
  @Post('ingest')
  async triggerIngest() {
    const job = await this.queue.enqueueFullSync();
    return { enqueued: true, jobId: job.id };
  }

  @UseGuards(AdminGuard)
  @Post('reclassify')
  async reclassify(@Query('force') force?: string) {
    return this.classifier.reclassifyAll(force === 'true');
  }

  @UseGuards(AdminGuard)
  @Post('ingest-editais')
  async triggerEditais() {
    const result = await this.editaisIngestion.ingest();
    return { ok: true, ...result };
  }

  @UseGuards(AdminGuard)
  @Post('ingest-emendas-orc')
  async triggerEmendasOrc() {
    const result = await this.emendasIngestion.ingest();
    return { ok: true, ...result };
  }

  @UseGuards(AdminGuard)
  @Post('check-absences')
  async triggerAbsences(@Query('days') days?: string) {
    const parsedDays = days ? Number(days) : 7;
    const safeDays = Number.isFinite(parsedDays) ? Math.min(Math.max(Math.floor(parsedDays), 1), 365) : 7;
    const result = await this.absence.checkRecentAbsences(safeDays);
    return { ok: true, ...result };
  }

  @UseGuards(AdminGuard)
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

  @UseGuards(AdminGuard)
  @Post('check-laws')
  async triggerLawsAlert() {
    const result = await this.laws.checkApprovedLaws();
    return { ok: true, ...result };
  }

  async seedMayors(): Promise<{ seeded: number }> {
    const candidatePaths = [
      path.resolve(process.cwd(), 'db/migrations/019_seed_184_ceara_mayors.sql'),
      path.resolve(process.cwd(), '../../db/migrations/019_seed_184_ceara_mayors.sql'),
      path.resolve(__dirname, '../../../../../db/migrations/019_seed_184_ceara_mayors.sql'),
    ];
    const migrationFile = candidatePaths.find((p) => fs.existsSync(p));
    if (!migrationFile) {
      throw new Error('Arquivo de migração dos 184 prefeitos (019_seed_184_ceara_mayors.sql) não encontrado.');
    }
    const sql = fs.readFileSync(migrationFile, 'utf8');
    await this.pool.query(sql);
    const { rows } = await this.pool.query(
      `SELECT COUNT(*)::int as cnt FROM municipal_authorities WHERE role_type = 'prefeito' AND active = true`,
    );
    const count = rows[0]?.cnt ?? 0;
    this.logger.log(`184 Ceará Mayors seeded/upserted successfully. Total active mayors: ${count}`);
    return { seeded: count };
  }

  @UseGuards(AdminGuard)
  @Post('seed-mayors')
  async triggerSeedMayors() {
    const result = await this.seedMayors();
    return { ok: true, ...result };
  }
}
