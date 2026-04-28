import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { DomainEvent } from '../../shared/event-bus';

/**
 * Persiste eventos em system_events e propaga via SSE para clients web.
 * Listeners por tipo permitem expansão futura (ex.: enviar e-mail / push).
 */
@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly service: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {}

  @OnEvent('NEW_PROPOSITION')
  async onNewProposition(event: DomainEvent) {
    await this.handle(event);
  }

  @OnEvent('STATUS_CHANGED')
  async onStatusChanged(event: DomainEvent) {
    await this.handle(event);
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
}
