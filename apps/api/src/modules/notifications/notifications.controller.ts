import { Controller, Get, Query, Sse, MessageEvent } from '@nestjs/common';
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

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.gateway.stream().pipe(
      map((event) => ({ type: event.type, data: event })),
    );
  }
}
