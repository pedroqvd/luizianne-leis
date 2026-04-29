import { Controller, Get, Query, Sse, MessageEvent } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

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
  @SkipThrottle()
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.gateway.stream().pipe(
      map((event) => ({ type: event.type, data: event })),
    );
  }
}
