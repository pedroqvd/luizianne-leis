import { Controller, Get, Query, Sse, MessageEvent, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { Observable, map, interval, merge } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { Public } from '../../infra/auth';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {}

  @Get()
  list(@Query('limit') limit?: string) {
    return this.service.list(limit ? Number(limit) : 50);
  }

  // SSE keeps a long-lived connection; cliente pode reconectar com frequência
  // (mobile, retomada de aba). Throttler conta cada handshake — pular para evitar 429.
  // FIX #2: Marcado como @Public() pois SSE precisa ser acessível sem JWT
  @Public()
  @SkipThrottle()
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    try {
      const events$ = this.gateway.stream().pipe(
        map((event) => ({ type: event.type, data: event } as MessageEvent)),
      );

      // FIX #4: Heartbeat a cada 30s para detectar desconexões e manter alive
      const heartbeat$ = interval(30_000).pipe(
        map(() => ({ type: 'heartbeat', data: { ts: new Date().toISOString() } } as MessageEvent)),
      );

      return merge(events$, heartbeat$);
    } catch {
      throw new ServiceUnavailableException('Too many SSE connections — try again later');
    }
  }
}
