import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventType } from './types';

export interface DomainEvent<T = unknown> {
  type: EventType;
  aggregateType: 'proposition' | 'vote' | 'deputy' | 'edital' | 'authority';
  aggregateId: number;
  payload: T;
  occurredAt: string;
}

@Injectable()
export class EventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  async emit<T>(event: Omit<DomainEvent<T>, 'occurredAt'>): Promise<void> {
    await this.emitter.emitAsync(event.type, {
      ...event,
      occurredAt: new Date().toISOString(),
    });
  }
}
