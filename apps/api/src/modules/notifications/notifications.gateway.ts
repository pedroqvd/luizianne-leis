import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { DomainEvent } from '../../shared/event-bus';

/**
 * Gateway leve baseado em RxJS Subject para entregar eventos via SSE.
 * (Uma única instância no monolith; em multi-node, plugar Redis Pub/Sub.)
 */
@Injectable()
export class NotificationsGateway {
  private readonly subject = new Subject<DomainEvent>();

  broadcast(event: DomainEvent) {
    this.subject.next(event);
  }

  stream(): Observable<DomainEvent> {
    return this.subject.asObservable();
  }
}
