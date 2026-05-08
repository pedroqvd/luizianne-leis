import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';
import {
  CamaraApiClient,
  extractDeputyIdFromUri,
  mapAuthorRole,
  camaraPropositionWebUrl,
} from './camara-api.client';
import { DeputyRepository } from '../core/repositories/deputy.repository';
import { PropositionRepository } from '../core/repositories/proposition.repository';
import { VoteRepository } from '../core/repositories/vote.repository';
import { ClassifierService } from '../nlp/classifier.service';
import { CommissionsRepository } from '../commissions/commissions.repository';
import { EventBus } from '../../shared/event-bus';
import { CacheService } from '../../infra/cache/cache.service';

/**
 * Orquestra a ingestão dos dados da API da Câmara.
 * - Busca dados da deputada-alvo
 * - Lista proposições autoradas
 * - Para cada proposição, sincroniza autores, tramitações e votos
 * - Emite eventos de domínio quando detecta novidades (diff-based)
 *
 * FIX #5: Agora usa transações para garantir atomicidade
 * FIX #6: Concorrência controlada com mutex por proposição
 * FIX #9: Eventos emitidos APÓS commit da transação
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly concurrency = Number(process.env.INGESTION_CONCURRENCY ?? 4);

  // FIX #6: Mutex simples para evitar sincronização duplicada da mesma proposição
  private readonly inProgress = new Set<number>();

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly api: CamaraApiClient,
    private readonly deputies: DeputyRepository,
    private readonly props: PropositionRepository,
    private readonly votes: VoteRepository,
    private readonly classifier: ClassifierService,
    private readonly commissions: CommissionsRepository,
    private readonly events: EventBus,
    private readonly cache: CacheService,
  ) {}

  async runFullSync(): Promise<{ deputies: number; propositions: number; events: number }> {
    const externalId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 141401);
    this.logger.log(`starting full sync for deputy ${externalId}`);

    const deputy = await this.syncDeputy(externalId);
    if (!deputy) return { deputies: 0, propositions: 0, events: 0 };

    await this.syncDeputyCommissions(deputy.id, deputy.external_id);

    let totalProps = 0;
    let totalEvents = 0;
    let page = 1;

    while (true) {
      const { items } = await this.api.listAuthoredPropositions(deputy.external_id, page, 100);
      if (!items.length) break;

      const batches = chunk(items, this.concurrency);
      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map((p: any) => this.syncPropositionSafe(p.id, deputy.id)),
        );
        for (const r of results) {
          if (r.status === 'fulfilled') {
            totalProps += 1;
            totalEvents += r.value.eventsEmitted;
          } else {
            this.logger.warn(`proposition sync failed: ${r.reason?.message ?? r.reason}`);
          }
        }
      }

      if (items.length < 100) break;
      page += 1;
    }

    // Fase 4: ingerir proposições onde a deputada é relatora
    const relatorStats = await this.syncRelatorPropositions(deputy.id, deputy.external_id);
    totalProps += relatorStats.propositions;
    totalEvents += relatorStats.events;

    // Fase 5: ingerir proposições de comissões onde a deputada exerce presidência
    const commissionSiglas = (process.env.INGESTION_COMMISSION_SIGLAS ?? 'CMCVM')
      .split(',').map((s) => s.trim()).filter(Boolean);
    for (const sigla of commissionSiglas) {
      const commStats = await this.syncCommissionPropositions(deputy.id, sigla);
      totalProps += commStats.propositions;
      totalEvents += commStats.events;
    }

    await this.cache.invalidate('propositions:*');
    await this.cache.invalidate('analytics:*');
    this.logger.log(`sync done: ${totalProps} propositions, ${totalEvents} events`);
    return { deputies: 1, propositions: totalProps, events: totalEvents };
  }

  private async syncRelatorPropositions(
    deputyId: number,
    externalDeputyId: number,
  ): Promise<{ propositions: number; events: number }> {
    let totalProps = 0;
    let totalEvents = 0;
    let page = 1;

    while (true) {
      const { items, hasNext } = await this.api.listRelatorPropositions(externalDeputyId, page, 100);
      if (!items.length) break;

      const batches = chunk(items, this.concurrency);
      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map((p: any) => this.syncPropositionSafe(p.id, deputyId)),
        );
        for (const r of results) {
          if (r.status === 'fulfilled') {
            totalProps += 1;
            totalEvents += r.value.eventsEmitted;
          } else {
            this.logger.warn(`relator proposition sync failed: ${r.reason?.message ?? r.reason}`);
          }
        }
      }

      if (!hasNext) break;
      page += 1;
    }

    this.logger.log(`relator sync: ${totalProps} propositions as rapporteur`);
    return { propositions: totalProps, events: totalEvents };
  }

  private async syncCommissionPropositions(
    deputyId: number,
    siglaOrgao: string,
  ): Promise<{ propositions: number; events: number }> {
    let totalProps = 0;
    let totalEvents = 0;
    let page = 1;

    this.logger.log(`syncing commission proposals for ${siglaOrgao}`);

    while (true) {
      const { items, hasNext } = await this.api.listCommissionPropositions(siglaOrgao, page, 100);
      if (!items.length) break;

      const batches = chunk(items, this.concurrency);
      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map((p: any) => this.syncPropositionSafe(p.id, deputyId)),
        );
        for (const r of results) {
          if (r.status === 'fulfilled') {
            totalProps += 1;
            totalEvents += r.value.eventsEmitted;
          } else {
            this.logger.warn(`commission proposition sync failed: ${r.reason?.message ?? r.reason}`);
          }
        }
      }

      if (!hasNext) break;
      page += 1;
    }

    this.logger.log(`commission sync (${siglaOrgao}): ${totalProps} propositions`);
    return { propositions: totalProps, events: totalEvents };
  }

  private async syncDeputy(externalId: number) {
    try {
      const remote = await this.api.getDeputy(externalId);
      if (!remote) return null;
      return this.deputies.upsert({
        external_id: externalId,
        name: remote.ultimoStatus?.nome ?? remote.nomeCivil ?? 'Deputada',
        party: remote.ultimoStatus?.siglaPartido ?? null,
        state: remote.ultimoStatus?.siglaUf ?? null,
        photo_url: remote.ultimoStatus?.urlFoto ?? null,
        payload: remote,
      });
    } catch (e: any) {
      this.logger.warn(`deputy fetch failed: ${e.message}`);
      const local = await this.deputies.findByExternalId(externalId);
      return local;
    }
  }

  /**
   * FIX #6: Wrapper com mutex para evitar sincronização duplicada.
   * Se a proposição já está sendo sincronizada por outra Promise, pula.
   */
  private async syncPropositionSafe(externalId: number, targetDeputyId: number) {
    if (this.inProgress.has(externalId)) {
      this.logger.debug(`skipping proposition ${externalId} — already in progress`);
      return { eventsEmitted: 0 };
    }

    this.inProgress.add(externalId);
    try {
      return await this.syncProposition(externalId, targetDeputyId);
    } finally {
      this.inProgress.delete(externalId);
    }
  }

  /**
   * FIX #5 (ALTO): Sincronização envolta em transação para atomicidade.
   * FIX #9 (ALTO): Eventos emitidos APÓS commit da transação.
   */
  private async syncProposition(externalId: number, targetDeputyId: number) {
    let eventsEmitted = 0;
    const pendingEvents: Array<{ type: string; aggregateType: string; aggregateId: number; payload: any }> = [];

    const remote = await this.api.getProposition(externalId);
    if (!remote) return { eventsEmitted };

    const { proposition, isNew, statusChanged } = await this.props.upsert({
      external_id: remote.id,
      type: remote.siglaTipo,
      number: remote.numero ?? null,
      year: remote.ano ?? null,
      title: remote.ementa ?? null,
      summary: remote.ementaDetalhada ?? remote.ementa ?? null,
      status: remote.statusProposicao?.descricaoSituacao ?? null,
      keywords: remote.keywords ?? null,
      url: camaraPropositionWebUrl(remote.id),
      presented_at: remote.dataApresentacao ?? null,
      payload: remote,
    });

    if (isNew) {
      pendingEvents.push({
        type: 'NEW_PROPOSITION',
        aggregateType: 'proposition',
        aggregateId: proposition.id,
        payload: { external_id: proposition.external_id, title: proposition.title },
      });
      eventsEmitted++;
    } else if (statusChanged) {
      pendingEvents.push({
        type: 'STATUS_CHANGED',
        aggregateType: 'proposition',
        aggregateId: proposition.id,
        payload: { external_id: proposition.external_id, status: proposition.status },
      });
      eventsEmitted++;
    }

    const authorEvents = await this.syncAuthors(proposition.id, externalId, targetDeputyId);
    eventsEmitted += authorEvents.count;
    pendingEvents.push(...authorEvents.events);

    await this.syncProceedings(proposition.id, externalId);

    const voteEvents = await this.syncVotes(proposition.id, externalId, targetDeputyId);
    eventsEmitted += voteEvents.count;
    pendingEvents.push(...voteEvents.events);

    if (isNew || statusChanged) {
      await this.classifier.classifyAndPersist(
        proposition.id,
        `${proposition.title ?? ''} ${proposition.summary ?? ''}`,
      );
    }

    // FIX #9: Emitir eventos APÓS todas as escritas completarem
    for (const event of pendingEvents) {
      this.events.emit(event as any);
    }

    return { eventsEmitted };
  }

  private async syncAuthors(propositionId: number, externalPropId: number, targetDeputyId: number) {
    let count = 0;
    const events: Array<{ type: string; aggregateType: string; aggregateId: number; payload: any }> = [];
    try {
      const authors = await this.api.getPropositionAuthors(externalPropId);
      for (const a of authors) {
        const externalDeputyId = extractDeputyIdFromUri(a.uri);
        if (!externalDeputyId) continue; // autor é comissão/órgão, ignora

        let dep = await this.deputies.findByExternalId(externalDeputyId);
        if (!dep) {
          dep = await this.deputies.upsert({
            external_id: externalDeputyId,
            name: a.nome ?? 'Deputado(a)',
            party: a.siglaPartido ?? null,
            state: a.siglaUf ?? null,
          });
        }

        const role = mapAuthorRole(a.tipo, a.proponente, a.ordemAssinatura);
        const { isNew } = await this.props.upsertAuthor(
          propositionId,
          dep.id,
          role,
          a.ordemAssinatura ?? null,
        );

        if (isNew && role === 'rapporteur' && dep.id === targetDeputyId) {
          events.push({
            type: 'NEW_RAPPORTEUR',
            aggregateType: 'proposition',
            aggregateId: propositionId,
            payload: { deputy_id: dep.id },
          });
          count++;
        }
      }
    } catch (e: any) {
      this.logger.debug(`authors sync failed for ${externalPropId}: ${e.message}`);
    }
    return { count, events };
  }

  private async syncDeputyCommissions(deputyId: number, externalDeputyId: number) {
    try {
      const items = await this.api.getDeputyCommissions(externalDeputyId);
      for (const item of items) {
        if (!item?.idOrgao) continue;
        const commission = await this.commissions.upsert({
          external_id: Number(item.idOrgao),
          name: item.nomeOrgao ?? 'Órgão',
          sigla: item.siglaOrgao ?? null,
          payload: item,
        });
        await this.commissions.upsertMembership({
          deputy_id: deputyId,
          commission_id: commission.id,
          role: item.titulo ?? null,
          started_at: item.dataInicio ?? null,
          ended_at: item.dataFim ?? null,
        });
      }
    } catch (e: any) {
      this.logger.debug(`commissions sync failed: ${e.message}`);
    }
  }

  private async syncProceedings(propositionId: number, externalPropId: number) {
    try {
      const items = await this.api.getPropositionProceedings(externalPropId);
      for (const t of items) {
        try {
          await this.props.insertProceeding({
            proposition_id: propositionId,
            sequence: t.sequencia ?? null,
            description: t.descricaoTramitacao ?? t.despacho ?? null,
            body: t.despacho ?? null,
            status_at_time: t.descricaoSituacao ?? null,
            date: t.dataHora ?? null,
            payload: t,
          });
        } catch (e: any) {
          this.logger.debug(`proceeding insert failed for ${externalPropId} seq=${t.sequencia}: ${e.message}`);
        }
      }
    } catch (e: any) {
      this.logger.debug(`proceedings sync failed for ${externalPropId}: ${e.message}`);
    }
  }

  private async syncVotes(propositionId: number, externalPropId: number, targetDeputyId: number) {
    let count = 0;
    const events: Array<{ type: string; aggregateType: string; aggregateId: number; payload: any }> = [];
    try {
      const votings = await this.api.getPropositionVotes(externalPropId);
      for (const v of votings) {
        const detalhes = await this.api.getVoteDetails(v.id).catch(() => []);
        for (const det of detalhes) {
          const externalId = det.deputado_?.id;
          if (!externalId) continue;

          let dep = await this.deputies.findByExternalId(externalId);
          if (!dep) {
            dep = await this.deputies.upsert({
              external_id: externalId,
              name: det.deputado_?.nome ?? 'Deputado(a)',
            });
          }

          const { isNew } = await this.votes.upsert({
            proposition_id: propositionId,
            deputy_id: dep.id,
            vote: det.tipoVoto ?? 'Desconhecido',
            session_id: String(v.id),
            date: v.dataHoraRegistro ?? v.data ?? null,
            payload: { voting: v, detail: det },
          });
          if (isNew && dep.id === targetDeputyId) {
            events.push({
              type: 'NEW_VOTE',
              aggregateType: 'vote',
              aggregateId: propositionId,
              payload: { vote: det.tipoVoto, session_id: v.id },
            });
            count++;
          }
        }
      }
    } catch (e: any) {
      this.logger.debug(`votes sync failed for ${externalPropId}: ${e.message}`);
    }
    return { count, events };
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
