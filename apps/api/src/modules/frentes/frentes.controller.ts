import { Controller, Get, Post, HttpCode } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FrentesService } from './frentes.service';
import { FrentesIngestion } from './frentes.ingestion';

@ApiTags('frentes')
@Controller('frentes')
export class FrentesController {
  constructor(
    private readonly service: FrentesService,
    private readonly ingestion: FrentesIngestion,
  ) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @Post('ingest')
  @HttpCode(202)
  async ingest() {
    const result = await this.ingestion.sync();
    return { status: 'ok', ...result };
  }
}
