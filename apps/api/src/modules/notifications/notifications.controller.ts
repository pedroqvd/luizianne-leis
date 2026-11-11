import { Controller, Get, Query, Sse, MessageEvent, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { Observable, map, interval, merge } from 'rxjs';
import { Public } from '../../infra/auth';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {}

  @Public()
  @Get()
  list(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 50;
    const safeLimit = Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 1), 200) : 50;
    return this.service.list(safeLimit);
  }

  // SSE keeps a long-lived connection; JwtAuthGuard valida o token via query (?token=) ou header Authorization.
  @SkipThrottle()
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    try {
      const events$ = this.gateway.stream().pipe(
        map((event) => ({ type: event.type, data: event } as MessageEvent)),
      );

      const heartbeat$ = interval(30_000).pipe(
        map(() => ({ type: 'heartbeat', data: { ts: new Date().toISOString() } } as MessageEvent)),
      );

      return merge(events$, heartbeat$);
    } catch {
      throw new ServiceUnavailableException('Too many SSE connections — try again later');
    }
  }
}
