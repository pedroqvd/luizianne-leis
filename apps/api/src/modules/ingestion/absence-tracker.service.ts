import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';
import { CamaraApiClient } from './camara-api.client';
import { DeputyRepository } from '../core/repositories/deputy.repository';
import { PropositionRepository } from '../core/repositories/proposition.repository';
import { VoteRepository } from '../core/repositories/vote.repository';
import { EventBus } from '../../shared/event-bus';

/**
 * Detecta ausências da deputada em votações nominais.
 *
 * Fluxo:
 *  1. Busca TODAS as votações nominais do período via GET /votacoes
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
    private readonly events: EventBus,
  ) {}

  /**
   * Verifica ausências nos últimos `days` dias.
   * Chamado pelo scheduler (default: diário, olha 2 dias para cobrir sessões noturnas).
   */
  async checkRecentAbsences(days = 2): Promise<{ checked: number; absences: number }> {
    const externalId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 141401);
    const deputy = await this.deputies.findByExternalId(externalId);
    if (!deputy) {
      this.logger.warn('Target deputy not found in DB — run full sync first');
      return { checked: 0, absences: 0 };
    }

    const dataFim = toDate(new Date());
    const dataInicio = toDate(daysAgo(days));

    this.logger.log(`checking absences from ${dataInicio} to ${dataFim}`);

    let checked = 0;
    let absences = 0;
    let page = 1;

    while (true) {
      const { items, hasNext } = await this.api.listNominalVotings(dataInicio, dataFim, page);
      if (!items.length) break;

      for (const voting of items) {
        checked++;
        try {
          const absent = await this.processVoting(voting, deputy.id, externalId);
          if (absent) absences++;
        } catch (e: any) {
          this.logger.warn(`absence check failed for voting ${voting.id}: ${e.message}`);
        }
      }

      if (!hasNext) break;
      page++;
    }

    this.logger.log(`absence check done — ${checked} votações, ${absences} ausências`);
    return { checked, absences };
  }

  private async processVoting(
    voting: { id: string; data?: string; dataHoraRegistro?: string; proposicao_?: any },
    deputyId: number,
    deputyExternalId: number,
  ): Promise<boolean> {
    // Busca todos os votos desta votação
    const allVotes = await this.api.getVoteDetails(voting.id);

    // Verifica se a deputada está na lista
    const voted = allVotes.some((v) => v.deputado_?.id === deputyExternalId);
    if (voted) return false;

    // Deputada não votou — registra ausência
    const propExtId = voting.proposicao_?.id;
    if (!propExtId) return false;

    // Garante que a proposição existe no banco (upsert mínimo)
    const prop = await this.ensureProposition(voting.proposicao_);
    if (!prop) return false;

    const date = voting.dataHoraRegistro ?? voting.data ?? null;

    await this.votes.upsert({
      proposition_id: prop.id,
      deputy_id: deputyId,
      vote: 'Ausente',
      session_id: voting.id,
      date,
      is_absence: true,
      payload: { voting_id: voting.id, tipo: 'Nominal' },
    });

    this.events.emit({
      type: 'DEPUTY_ABSENT',
      aggregateType: 'vote',
      aggregateId: prop.id,
      payload: {
        session_id: voting.id,
        proposition_id: prop.id,
        proposition_title: prop.title,
        date,
      },
    });

    this.logger.log(`absence recorded: voting ${voting.id} prop ${prop.id}`);
    return true;
  }

  private async ensureProposition(p: {
    id: number; siglaTipo?: string; numero?: number; ano?: number; ementa?: string; uri?: string;
  }) {
    let prop = await this.props.findByExternalId(p.id);
    if (prop) return prop;

    // Tenta buscar detalhes completos da proposição
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
          url: detail.uri ?? null,
          presented_at: (detail as any).dataApresentacao ?? null,
          payload: detail,
        });
        return result.proposition;
      }
    } catch {}

    // Fallback: upsert mínimo com os dados da votação
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
        url: p.uri ?? null,
        presented_at: null,
        payload: p,
      });
      return result.proposition;
    } catch {
      return null;
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
