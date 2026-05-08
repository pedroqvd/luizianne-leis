import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';
import { CamaraApiClient, camaraPropositionWebUrl } from './camara-api.client';
import { DeputyRepository } from '../core/repositories/deputy.repository';
import { PropositionRepository } from '../core/repositories/proposition.repository';
import { VoteRepository } from '../core/repositories/vote.repository';

/**
 * Detecta ausências da deputada em votações nominais.
 *
 * Fluxo:
 *  1. Busca TODAS as votações nominais do período via GET /votacoes?tipoVotacao=Nominal
 *  2. Para cada votação, pega a lista de votos (GET /votacoes/{id}/votos)
 *  3. Se o external_id da deputada não aparecer → registra voto='Ausente'
 *  4. Emite evento DEPUTY_ABSENT para notificações
 */
@Injectable()
export class AbsenceTrackerService {
  private readonly logger = new Logger(AbsenceTrackerService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly api: CamaraApiClient,
    private readonly deputies: DeputyRepository,
    private readonly props: PropositionRepository,
    private readonly votes: VoteRepository,
  ) {}

  /**
   * Verifica ausências nos últimos `days` dias.
   * Chamado pelo scheduler (default: diário, olha 2 dias para cobrir sessões noturnas).
   */
  async checkRecentAbsences(days = 2): Promise<{ checked: number; absences: number; deputy_found: boolean }> {
    const dataFim = toDate(new Date());
    const dataInicio = toDate(daysAgo(days));
    return this.checkAbsencesInRange(dataInicio, dataFim);
  }

  /**
   * Verifica ausências em um intervalo explícito de datas.
   */
  async checkAbsencesInRange(
    dataInicio: string,
    dataFim: string,
  ): Promise<{ checked: number; absences: number; deputy_found: boolean }> {
    const externalId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    const deputy = await this.deputies.findByExternalId(externalId);
    if (!deputy) {
      this.logger.warn(`Target deputy external_id=${externalId} not found in DB — run POST /admin/ingest first`);
      return { checked: 0, absences: 0, deputy_found: false };
    }

    this.logger.log(`checking absences from ${dataInicio} to ${dataFim}`);

    let checked = 0;
    let absences = 0;
    let page = 1;

    while (page <= 500) {
      const { items, hasNext } = await withRetry(() => this.api.listNominalVotings(dataInicio, dataFim, page));
      if (!items.length) break;

      for (const voting of items) {
        checked++;
        try {
          const absent = await withRetry(() => this.processVoting(voting, deputy.id, externalId));
          if (absent) absences++;
        } catch (e: any) {
          this.logger.error(`Fatal: absence check failed for voting ${voting.id}: ${e.message}`);
          throw e; // Fail fast to prevent incomplete data
        }
      }

      if (!hasNext) break;
      page++;
    }

    this.logger.log(`absence check done (${dataInicio}→${dataFim}) — ${checked} votações, ${absences} ausências`);
    return { checked, absences, deputy_found: true };
  }

  /**
   * Retroage toda a história mês a mês desde INGEST_DATA_INICIO até hoje.
   * Processa em janelas mensais para não sobrecarregar a API da Câmara.
   * Cada janela aguarda 1 segundo entre si para respeitar rate limits.
   */
  async checkAllHistoricalAbsences(
    fromDate?: string,
    toDate_?: string,
  ): Promise<{ total_checked: number; total_absences: number; months_processed: number; deputy_found: boolean }> {
    const externalId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    const deputy = await this.deputies.findByExternalId(externalId);
    if (!deputy) {
      this.logger.warn(`Target deputy external_id=${externalId} not found in DB — run POST /admin/ingest first`);
      return { total_checked: 0, total_absences: 0, months_processed: 0, deputy_found: false };
    }

    const start = new Date(fromDate ?? process.env.INGEST_DATA_INICIO ?? '2015-02-01');
    const end = new Date(toDate_ ?? toDate(new Date()));

    this.logger.log(`Starting historical absence backfill from ${toDate(start)} to ${toDate(end)}`);

    let total_checked = 0;
    let total_absences = 0;
    let months_processed = 0;

    // Iterate month by month
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

    while (cursor <= end) {
      const monthStart = toDate(cursor);
      // Last day of this month
      const monthEndDate = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const monthEnd = toDate(monthEndDate < end ? monthEndDate : end);

      this.logger.log(`Processing month ${monthStart} → ${monthEnd}`);

      let page = 1;
      let monthChecked = 0;
      let monthAbsences = 0;

      while (page <= 500) {
        const { items, hasNext } = await withRetry(() => this.api.listNominalVotings(monthStart, monthEnd, page));
        if (!items.length) break;

        for (const voting of items) {
          monthChecked++;
          try {
            const absent = await withRetry(() => this.processVoting(voting, deputy.id, externalId));
            if (absent) monthAbsences++;
          } catch (e: any) {
            this.logger.error(`Fatal: absence check failed for voting ${voting.id}: ${e.message}`);
            throw e; // Fail fast
          }
        }

        if (!hasNext) break;
        page++;
        // Brief pause between pages within a month
        await sleep(500);
      }

      this.logger.log(`Month ${monthStart}: ${monthChecked} votações, ${monthAbsences} ausências`);

      total_checked += monthChecked;
      total_absences += monthAbsences;
      months_processed++;

      // Advance to next month
      cursor.setMonth(cursor.getMonth() + 1);
      // Pause between months to be respectful of the API
      await sleep(1000);
    }

    this.logger.log(
      `Historical backfill complete — ${months_processed} meses, ${total_checked} votações, ${total_absences} ausências`,
    );
    return { total_checked, total_absences, months_processed, deputy_found: true };
  }

  /**
   * FIX #6 (ALTO): Migrado para Outbox Pattern transacional.
   * O voto de ausência e o evento de notificação são gravados
   * na mesma transação ACID. Se o processo crashar, nada é perdido.
   */
  private async processVoting(
    voting: { id: string; data?: string; dataHoraRegistro?: string; proposicao_?: any },
    deputyId: number,
    deputyExternalId: number,
  ): Promise<boolean> {
    const allVotes = await this.api.getVoteDetails(voting.id);

    // Empty vote list means the API returned no data — skip to avoid false absences
    if (allVotes.length === 0) return false;

    const voted = allVotes.some((v) => v.deputado_?.id === deputyExternalId);
    if (voted) return false;

    const propExtId = voting.proposicao_?.id;
    if (!propExtId) return false;

    const prop = await this.ensureProposition(voting.proposicao_);
    if (!prop) return false;

    const date = voting.dataHoraRegistro ?? voting.data ?? null;

    // Transactional: vote + outbox event in same ACID commit
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await this.votes.upsert({
        proposition_id: prop.id,
        deputy_id: deputyId,
        vote: 'Ausente',
        session_id: voting.id,
        date,
        is_absence: true,
        payload: { voting_id: voting.id, tipo: 'Nominal' },
      }, client);

      await client.query(
        `INSERT INTO outbox_events (type, aggregate_type, aggregate_id, payload)
         VALUES ($1, $2, $3, $4)`,
        [
          'DEPUTY_ABSENT',
          'vote',
          prop.id,
          { session_id: voting.id, proposition_id: prop.id, proposition_title: prop.title, date },
        ],
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    this.logger.log(`absence recorded: voting ${voting.id} prop ${prop.id}`);
    return true;
  }

  private async ensureProposition(p: {
    id: number; siglaTipo?: string; numero?: number; ano?: number; ementa?: string; uri?: string;
  }) {
    const prop = await this.props.findByExternalId(p.id);
    if (prop) return prop;

    try {
      const detail = await this.api.getProposition(p.id);
      if (detail) {
        const result = await this.props.upsert({
          external_id: detail.id,
          type: detail.siglaTipo,
          number: detail.numero ?? null,
          year: detail.ano ?? null,
          title: detail.ementa ?? null,
          summary: (detail as any).ementaDetalhada ?? detail.ementa ?? null,
          status: (detail as any).statusProposicao?.descricaoSituacao ?? null,
          keywords: (detail as any).keywords ?? null,
          url: camaraPropositionWebUrl(detail.id),
          presented_at: (detail as any).dataApresentacao ?? null,
          payload: detail,
        });
        return result.proposition;
      }
    } catch (e: any) {
      this.logger.warn(`ensureProposition api fetch failed: ${e.message}`);
    }

    try {
      const result = await this.props.upsert({
        external_id: p.id,
        type: p.siglaTipo ?? 'PL',
        number: p.numero ?? null,
        year: p.ano ?? null,
        title: p.ementa ?? null,
        summary: null,
        status: null,
        keywords: null,
        url: camaraPropositionWebUrl(p.id),
        presented_at: null,
        payload: p,
      });
      return result.proposition;
    } catch (e: any) {
      this.logger.error(`ensureProposition fallback upsert failed: ${e.message}`);
      throw e;
    }
  }
}

function toDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (e: any) {
      attempt++;
      if (attempt >= maxRetries) throw e;
      await sleep(2000 * attempt);
    }
  }
  throw new Error('Unreachable');
}
