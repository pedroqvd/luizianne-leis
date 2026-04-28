import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventType } from './types';

export interface DomainEvent<T = unknown> {
  type: EventType;
  aggregateType: 'proposition' | 'vote' | 'deputy';
  aggregateId: number;
  payload: T;
  occurredAt: string;
}

@Injectable()
export class EventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  emit<T>(event: Omit<DomainEvent<T>, 'occurredAt'>): void {
    this.emitter.emit(event.type, {
      ...event,
      occurredAt: new Date().toISOString(),
    });
  }
}
