import { Injectable, Logger, OnModuleDestroy, HttpException } from '@nestjs/common';
import { Subject, Observable, finalize } from 'rxjs';
import { DomainEvent } from '../../shared/event-bus';

/**
 * FIX #4 (ALTO): Limita conexões SSE simultâneas por instância.
 * FIX #13 (MÉDIO): Documenta que Redis Pub/Sub é necessário para multi-node.
 *
 * Gateway leve baseado em RxJS Subject para entregar eventos via SSE.
 * NOTA: Em deploy multi-node, substituir Subject por Redis Pub/Sub para que
 * eventos emitidos em uma instância cheguem a clientes conectados em outra.
 */
@Injectable()
export class NotificationsGateway implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly subject = new Subject<DomainEvent>();

  // FIX #4: Limitar conexões SSE simultâneas para evitar DoS
  private readonly maxConnections = Number(process.env.SSE_MAX_CONNECTIONS ?? 100);
  private activeConnections = 0;

  broadcast(event: DomainEvent) {
    this.subject.next(event);
  }

  /**
   * Retorna Observable para SSE com controle de conexões e cleanup.
   * Lança erro se o limite de conexões for atingido.
   */
  stream(): Observable<DomainEvent> {
    if (this.activeConnections >= this.maxConnections) {
      this.logger.warn(`SSE connection rejected — limit reached (${this.maxConnections})`);
      throw new HttpException('Too many SSE connections', 429);
    }

    this.activeConnections++;
    this.logger.debug(`SSE connected (${this.activeConnections}/${this.maxConnections})`);

    return this.subject.asObservable().pipe(
      // Cleanup: decrementa contador quando o cliente desconecta
      finalize(() => {
        this.activeConnections--;
        this.logger.debug(`SSE disconnected (${this.activeConnections}/${this.maxConnections})`);
      }),
    );
  }

  getActiveConnections(): number {
    return this.activeConnections;
  }

  onModuleDestroy() {
    this.subject.complete();
  }
}
