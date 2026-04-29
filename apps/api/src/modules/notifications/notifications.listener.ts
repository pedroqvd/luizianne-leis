import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Pool } from 'pg';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from './email.service';
import { DomainEvent } from '../../shared/event-bus';
import { PG_POOL } from '../../infra/database/database.module';

const AREA_SLUG: Record<string, string> = {
  NEW_PROPOSITION: 'legislativo',
  STATUS_CHANGED:  'legislativo',
  NEW_VOTE:        'votacoes',
  NEW_RAPPORTEUR:  'legislativo',
};

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
  async onNewProposition(event: DomainEvent) {
    await this.handle(event);
    await this.sendEmailsForArea('legislativo', async (to) => ({
      subject: `Nova proposição: ${event.payload?.title?.slice(0, 60) ?? 'Legislativo'}`,
      html: this.email.newPropositionHtml({
        title:  event.payload?.title ?? '—',
        type:   event.payload?.type  ?? '—',
        number: event.payload?.number ?? 0,
        year:   event.payload?.year   ?? new Date().getFullYear(),
        url:    event.payload?.url,
      }),
    }));
  }

  @OnEvent('STATUS_CHANGED')
  async onStatusChanged(event: DomainEvent) {
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
  async onNewVote(event: DomainEvent) {
    await this.handle(event);
  }

  @OnEvent('NEW_RAPPORTEUR')
  async onNewRapporteur(event: DomainEvent) {
    await this.handle(event);
  }

  private async handle(event: DomainEvent) {
    this.logger.log(`event ${event.type} on ${event.aggregateType}#${event.aggregateId}`);
    await this.service.record(event);
    this.gateway.broadcast(event);
  }

  /** Busca membros com assinatura habilitada para a área e envia e-mail. */
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
        const msg = await buildEmail(to);
        await this.email.send({ to, ...msg });
      }
    } catch (e: any) {
      this.logger.warn(`sendEmailsForArea(${areaSlug}) failed: ${e.message}`);
    }
  }
}
