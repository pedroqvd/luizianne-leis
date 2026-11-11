import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public, AdminGuard } from '../../infra/auth';
import { CeapService } from './ceap.service';
import { CeapIngestion } from './ceap.ingestion';

@ApiTags('ceap')
@Public()
@Controller('ceap')
export class CeapController {
  constructor(
    private readonly service: CeapService,
    private readonly ingestion: CeapIngestion,
  ) {}

  @Get()
  @ApiQuery({ name: 'ano',    required: false })
  @ApiQuery({ name: 'tipo',   required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit',  required: false })
  @ApiQuery({ name: 'offset', required: false })
  list(
    @Query('ano')    ano?: string,
    @Query('tipo')   tipo?: string,
    @Query('search') search?: string,
    @Query('limit')  limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.list({
      ano:    ano    ? Number(ano)    : undefined,
      tipo,
      search,
      limit:  limit  ? Number(limit)  : 60,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('stats')
  stats() { return this.service.stats(); }

  @Get('by-year')
  byYear() { return this.service.byYear(); }

  @Get('by-tipo')
  byTipo() { return this.service.byTipo(); }

  @Post('ingest')
  @Public()
  @UseGuards(AdminGuard)
  ingestRecent() { return this.ingestion.syncRecent(); }

  @Post('ingest/historical')
  @Public()
  @UseGuards(AdminGuard)
  ingestHistorical() { return this.ingestion.syncHistorical(); }
}
