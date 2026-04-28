import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @Get('productivity')
  productivity() {
    return this.service.productivity();
  }

  @Get('approval')
  approval() {
    return this.service.approval();
  }

  @Get('network')
  network() {
    return this.service.network();
  }

  @Get('categories')
  categories() {
    return this.service.categories();
  }
}
