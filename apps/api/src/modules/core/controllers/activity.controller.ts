import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActivityService } from '../services/activity.service';

@ApiTags('activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Get('authorship')
  authorship(@Query('limit') limit?: string) {
    return this.service.byRole('author', limit ? Number(limit) : 100);
  }

  @Get('coauthorship')
  coauthorship(@Query('limit') limit?: string) {
    return this.service.byRole('coauthor', limit ? Number(limit) : 100);
  }

  @Get('rapporteur')
  rapporteur(@Query('limit') limit?: string) {
    return this.service.byRole('rapporteur', limit ? Number(limit) : 100);
  }
}
