import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
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
import { CacheService } from '../../infra/cache/cache.service';

const MATERIALIZED_VIEWS = [
  'v_deputy_productivity',
  'v_proposition_approval',
  'v_coauthorship_edges',
  'v_categories_breakdown',
] as const;

/**
 * Orquestra a ingestão dos dados da API da Câmara.
 * - Busca dados da deputada-alvo
 * - Lista proposições autoradas
 * - Para cada proposição, busca dados remotos ANTES de abrir transação SQL (evita pool starvation/deadlock)
 * - Emite eventos de domínio via Outbox transacional quando detecta novidades (diff-based)
 * - Atualiza todas as 4 Materialized Views ao final
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly concurrency = Number(process.env.INGESTION_CONCURRENCY ?? 4);
  private readonly inProgress = new Set<number>();

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly api: CamaraApiClient,
    private readonly deputies: DeputyRepository,
    private readonly props: PropositionRepository,
    private readonly votes: VoteRepository,
    private readonly classifier: ClassifierService,
    private readonly commissions: CommissionsRepository,
    private readonly cache: CacheService,
  ) {}

  async runFullSync(): Promise<{ deputies: number; propositions: number; events: number }> {
    const externalId = Number(process.env.TARGET_DEPUTY_EXTERNAL_ID ?? 178866);
    this.logger.log(`starting full sync for deputy ${externalId}`);

    const deputy = await this.syncDeputy(externalId);
    if (!deputy) return { deputies: 0, propositions: 0, events: 0 };

    await this.syncDeputyCommissions(deputy.id, deputy.external_id);

    const deputyName = process.env.TARGET_DEPUTY_NAME ?? 'Luizianne';
    const deputyUf = process.env.TARGET_DEPUTY_UF ?? 'CE';
    const currentLegislatura = Number(process.env.TARGET_DEPUTY_LEGISLATURA ?? 57);
    const startLegislatura = Number(process.env.INGEST_START_LEGISLATURA ?? 55);
    const allDeputyIds = new Set<number>([externalId]);

    for (let leg = startLegislatura; leg < currentLegislatura; leg++) {
      try {
        const ids = await this.api.findDeputyIdsByLegislatura(deputyName, leg, deputyUf);
        ids.forEach((id) => allDeputyIds.add(id));
        this.logger.log(`legislatura ${leg}: found ids [${ids.join(', ')}]`);
      } catch (e: any) {
        this.logger.warn(`failed to discover ids for legislatura ${leg}: ${e.message}`);
      }
    }

    this.logger.log(`syncing propositions for deputy ids: [${Array.from(allDeputyIds).join(', ')}]`);

    const historicalIdMap = new Map<number, number>();
    for (const histId of allDeputyIds) {
      if (histId !== externalId) {
        historicalIdMap.set(histId, deputy.id);
      }
    }

    let totalProps = 0;
    let totalEvents = 0;

    for (const depId of allDeputyIds) {
      let page = 1;
      while (page <= 500) {
        const { items } = await this.api.listAuthoredPropositions(depId, page, 100);
        if (!items.length) break;

        const batches = chunk(items, this.concurrency);
        for (const batch of batches) {
          const results = await Promise.allSettled(
            batch.map((p: any) => this.syncPropositionSafe(p.id, deputy.id, historicalIdMap)),
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

        if (page === 1) {
          await this.refreshMaterializedViews().catch(() => undefined);
          await this.cache.invalidate('analytics:*').catch(() => undefined);
        }

        if (items.length < 100) break;
        page += 1;
      }

      const relatorStats = await this.syncRelatorPropositions(deputy.id, depId, historicalIdMap);
      totalProps += relatorStats.propositions;
      totalEvents += relatorStats.events;
      await this.refreshMaterializedViews().catch(() => undefined);
    }

    const commissionSiglas = (process.env.INGESTION_COMMISSION_SIGLAS ?? 'CMCVM')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const sigla of commissionSiglas) {
      const commStats = await this.syncCommissionPropositions(deputy.id, sigla, historicalIdMap);
      totalProps += commStats.propositions;
      totalEvents += commStats.events;
    }

    await this.refreshMaterializedViews();
    await this.cache.invalidate('propositions:*');
    await this.cache.invalidate('analytics:*');
    await this.cache.invalidate('votes:*');
    await this.cache.invalidate('commissions:*');

    this.logger.log(`sync done: ${totalProps} propositions, ${totalEvents} events`);
    return { deputies: 1, propositions: totalProps, events: totalEvents };
  }

  async refreshMaterializedViews(): Promise<void> {
    for (const viewName of MATERIALIZED_VIEWS) {
      try {
        await this.pool.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`);
        this.logger.debug(`Materialized view ${viewName} refreshed concurrently.`);
      } catch (e: any) {
        this.logger.warn(`Concurrent refresh failed for ${viewName} (${e.message}), trying non-concurrent refresh`);
        try {
          await this.pool.query(`REFRESH MATERIALIZED VIEW ${viewName}`);
        } catch (err: any) {
          this.logger.warn(`Materialized view ${viewName} refresh failed: ${err.message}`);
        }
      }
    }
  }

  private async syncRelatorPropositions(
    deputyId: number,
    externalDeputyId: number,
    historicalIdMap?: Map<number, number>,
  ): Promise<{ propositions: number; events: number }> {
    let totalProps = 0;
    let totalEvents = 0;
    let page = 1;

    while (page <= 500) {
      const { items, hasNext } = await this.api.listRelatorPropositions(externalDeputyId, page, 100);
      if (!items.length) break;

      const batches = chunk(items, this.concurrency);
      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map((p: any) => this.syncPropositionSafe(p.id, deputyId, historicalIdMap)),
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
    historicalIdMap?: Map<number, number>,
  ): Promise<{ propositions: number; events: number }> {
    let totalProps = 0;
    let totalEvents = 0;
    let page = 1;

    this.logger.log(`syncing commission proposals for ${siglaOrgao}`);

    while (page <= 500) {
      const { items, hasNext } = await this.api.listCommissionPropositions(siglaOrgao, page, 100);
      if (!items.length) break;

      const batches = chunk(items, this.concurrency);
      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map((p: any) => this.syncPropositionSafe(p.id, deputyId, historicalIdMap)),
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

  private async syncPropositionSafe(
    externalId: number,
    targetDeputyId: number,
    historicalIdMap?: Map<number, number>,
  ) {
    if (this.inProgress.has(externalId)) {
      this.logger.debug(`skipping proposition ${externalId} — already in progress`);
      return { eventsEmitted: 0 };
    }

    this.inProgress.add(externalId);
    try {
      return await this.syncProposition(externalId, targetDeputyId, historicalIdMap);
    } finally {
      this.inProgress.delete(externalId);
    }
  }

  private async syncProposition(
    externalId: number,
    targetDeputyId: number,
    historicalIdMap?: Map<number, number>,
  ) {
    let eventsEmitted = 0;
    const pendingEvents: Array<{ type: string; aggregateType: string; aggregateId: number; payload: any }> = [];

    // 1. Buscar TODOS os dados HTTP na API da Câmara ANTES de abrir transação no banco
    const remote = await this.api.getProposition(externalId);
    if (!remote) return { eventsEmitted };

    const [authors, proceedings, votings] = await Promise.all([
      this.api.getPropositionAuthors(externalId),
      this.api.getPropositionProceedings(externalId),
      this.api.getPropositionVotes(externalId),
    ]);

    const votingDetailsList: Array<{ voting: any; detalhes: any[] }> = [];
    for (const v of votings) {
      const detalhes = await this.api.getVoteDetails(v.id).catch((e: any) => {
        this.logger.warn(`getVoteDetails failed for voting ${v.id}: ${e.message}`);
        return [];
      });
      votingDetailsList.push({ voting: v, detalhes });
    }

    // 2. Abrir transação curta somente para persistência local no PostgreSQL
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { proposition, isNew, statusChanged } = await this.props.upsert(
        {
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
        },
        client,
      );

      const fullPropositionPayload = {
        external_id: proposition.external_id,
        type: proposition.type,
        number: proposition.number,
        year: proposition.year,
        title: proposition.title,
        status: proposition.status,
        url: proposition.url,
      };

      if (isNew) {
        pendingEvents.push({
          type: 'NEW_PROPOSITION',
          aggregateType: 'proposition',
          aggregateId: proposition.id,
          payload: fullPropositionPayload,
        });
        eventsEmitted++;
      } else if (statusChanged) {
        pendingEvents.push({
          type: 'STATUS_CHANGED',
          aggregateType: 'proposition',
          aggregateId: proposition.id,
          payload: fullPropositionPayload,
        });
        eventsEmitted++;
      }

      const authorEvents = await this.persistAuthors(
        proposition.id,
        authors,
        targetDeputyId,
        client,
        historicalIdMap,
      );
      eventsEmitted += authorEvents.count;
      pendingEvents.push(...authorEvents.events);

      await this.persistProceedings(proposition.id, externalId, proceedings, client);

      const voteEvents = await this.persistVotes(
        proposition.id,
        votingDetailsList,
        targetDeputyId,
        client,
      );
      eventsEmitted += voteEvents.count;
      pendingEvents.push(...voteEvents.events);

      if (pendingEvents.length > 0) {
        for (const event of pendingEvents) {
          await client.query(
            `INSERT INTO outbox_events (type, aggregate_type, aggregate_id, payload)
             VALUES ($1, $2, $3, $4)`,
            [event.type, event.aggregateType, event.aggregateId, event.payload],
          );
        }
      }

      await client.query('COMMIT');

      if (isNew || statusChanged) {
        try {
          await this.classifier.classifyAndPersist(
            proposition.id,
            `${proposition.title ?? ''} ${proposition.summary ?? ''}`,
          );
        } catch (e: any) {
          this.logger.error(`classifyAndPersist failed for ${proposition.id}: ${e.message}`);
        }
      }

      return { eventsEmitted };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  private async persistAuthors(
    propositionId: number,
    authors: any[],
    targetDeputyId: number,
    client: PoolClient,
    historicalIdMap?: Map<number, number>,
  ) {
    let count = 0;
    const events: Array<{ type: string; aggregateType: string; aggregateId: number; payload: any }> = [];

    for (const a of authors) {
      const externalDeputyId = extractDeputyIdFromUri(a.uri);
      if (!externalDeputyId) continue;

      let dep: { id: number };
      if (historicalIdMap?.has(externalDeputyId)) {
        dep = { id: historicalIdMap.get(externalDeputyId)! };
      } else {
        dep =
          (await this.deputies.findByExternalId(externalDeputyId, client)) ??
          (await this.deputies.upsert(
            {
              external_id: externalDeputyId,
              name: a.nome ?? 'Deputado(a)',
              party: a.siglaPartido ?? null,
              state: a.siglaUf ?? null,
            },
            client,
          ));
      }

      const role = mapAuthorRole(a.tipo, a.proponente, a.ordemAssinatura);
      const { isNew } = await this.props.upsertAuthor(
        propositionId,
        dep.id,
        role,
        a.ordemAssinatura ?? null,
        client,
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
      this.logger.error(`commissions sync failed: ${e.message}`);
      throw e;
    }
  }

  private async persistProceedings(
    propositionId: number,
    externalPropId: number,
    items: any[],
    client: PoolClient,
  ) {
    for (const t of items) {
      try {
        await this.props.insertProceeding(
          {
            proposition_id: propositionId,
            sequence: t.sequencia ?? null,
            description: t.descricaoTramitacao ?? t.despacho ?? null,
            body: t.despacho ?? null,
            status_at_time: t.descricaoSituacao ?? null,
            date: t.dataHora ?? null,
            payload: t,
          },
          client,
        );
      } catch (e: any) {
        this.logger.error(`proceeding insert failed for ${externalPropId} seq=${t.sequencia}: ${e.message}`);
        throw e;
      }
    }
  }

  private async persistVotes(
    propositionId: number,
    votingDetailsList: Array<{ voting: any; detalhes: any[] }>,
    targetDeputyId: number,
    client: PoolClient,
  ) {
    let count = 0;
    const events: Array<{ type: string; aggregateType: string; aggregateId: number; payload: any }> = [];

    for (const { voting: v, detalhes } of votingDetailsList) {
      for (const det of detalhes) {
        const externalId = det.deputado_?.id;
        if (!externalId) continue;

        let dep = await this.deputies.findByExternalId(externalId, client);
        if (!dep) {
          dep = await this.deputies.upsert(
            {
              external_id: externalId,
              name: det.deputado_?.nome ?? 'Deputado(a)',
            },
            client,
          );
        }

        const { isNew } = await this.votes.upsert(
          {
            proposition_id: propositionId,
            deputy_id: dep.id,
            vote: det.tipoVoto ?? 'Desconhecido',
            session_id: String(v.id),
            date: v.dataHoraRegistro ?? v.data ?? null,
            payload: { voting: v, detail: det },
          },
          client,
        );
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

    return { count, events };
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
