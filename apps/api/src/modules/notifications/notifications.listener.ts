import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Pool } from 'pg';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from './email.service';
import { DomainEvent } from '../../shared/event-bus';
import { PG_POOL } from '../../infra/database/database.module';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly service: NotificationsService,
    private readonly gateway: NotificationsGateway,
    private readonly email: EmailService,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  @OnEvent('NEW_PROPOSITION')
  async onNewProposition(event: DomainEvent<Record<string, any>>) {
    await this.handle(event);
    await this.sendEmailsForArea('legislativo', async () => ({
      subject: `Nova proposição: ${String(event.payload?.title ?? 'Legislativo').slice(0, 60)}`,
      html: this.email.newPropositionHtml({
        title:  event.payload?.title  ?? '—',
        type:   event.payload?.type   ?? '—',
        number: event.payload?.number ?? 0,
        year:   event.payload?.year   ?? new Date().getFullYear(),
        url:    event.payload?.url,
      }),
    }));
  }

  @OnEvent('STATUS_CHANGED')
  async onStatusChanged(event: DomainEvent<Record<string, any>>) {
    await this.handle(event);
    await this.sendEmailsForArea('legislativo', async () => ({
      subject: `Status atualizado: ${event.payload?.status ?? ''}`,
      html: this.email.statusChangedHtml({
        title:  event.payload?.title  ?? '—',
        type:   event.payload?.type   ?? '—',
        number: event.payload?.number ?? 0,
        year:   event.payload?.year   ?? new Date().getFullYear(),
        status: event.payload?.status ?? '—',
        url:    event.payload?.url,
      }),
    }));
  }

  @OnEvent('NEW_VOTE')
  async onNewVote(event: DomainEvent<Record<string, any>>) {
    await this.handle(event);
  }

  @OnEvent('NEW_RAPPORTEUR')
  async onNewRapporteur(event: DomainEvent<Record<string, any>>) {
    await this.handle(event);
  }

  /** Ausência da deputada em votação nominal */
  @OnEvent('DEPUTY_ABSENT')
  async onDeputyAbsent(event: DomainEvent<Record<string, any>>) {
    await this.handle(event);
    // FIX #24 (BAIXO): Área 'ausencias' agora existe na migração 010
    await this.sendEmailsForArea('ausencias', async () => ({
      subject: `⚠️ Ausência em votação nominal — ${fmtDate(event.payload?.date)}`,
      html: this.email.absenceHtml({
        proposition_title: event.payload?.proposition_title ?? '—',
        session_id:        String(event.payload?.session_id ?? ''),
        date:              event.payload?.date,
      }),
    }));
  }

  /** Lei aprovada — emitido pelo LawsAlertService */
  @OnEvent('LAW_APPROVED')
  async onLawApproved(event: DomainEvent<Record<string, any>>) {
    await this.handle(event);
    await this.sendEmailsForArea('legislativo', async () => ({
      subject: `✅ Aprovada: ${String(event.payload?.title ?? '').slice(0, 60)}`,
      html: this.email.approvedLawHtml({
        title:  event.payload?.title  ?? '—',
        type:   event.payload?.type   ?? '—',
        number: event.payload?.number ?? 0,
        year:   event.payload?.year   ?? new Date().getFullYear(),
        status: event.payload?.status ?? 'Aprovado',
        url:    event.payload?.url,
      }),
    }));
  }

  private async handle(event: DomainEvent<Record<string, any>>) {
    this.logger.log(`event ${event.type} on ${event.aggregateType}#${event.aggregateId}`);
    await this.service.record(event);
    this.gateway.broadcast(event);
  }

  private async sendEmailsForArea(
    areaSlug: string,
    buildEmail: (to: string) => Promise<{ subject: string; html: string }>,
  ) {
    try {
      const { rows } = await this.pool.query(
        `SELECT u.email
           FROM app_users u
           JOIN user_subscriptions us ON us.user_id = u.id
           JOIN notification_areas na ON na.id = us.area_id
           WHERE na.slug = $1 AND us.enabled = true AND u.email IS NOT NULL`,
        [areaSlug],
      );
      for (const { email: to } of rows) {
        try {
          const msg = await buildEmail(to);
          await this.email.send({ to, ...msg });
        } catch (e: any) {
          this.logger.warn(`sendEmailsForArea(${areaSlug}) failed for ${to}: ${e.message}`);
        }
      }
    } catch (e: any) {
      this.logger.warn(`sendEmailsForArea(${areaSlug}) failed: ${e.message}`);
    }
  }
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
