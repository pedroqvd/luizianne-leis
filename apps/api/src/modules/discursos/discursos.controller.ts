import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { DiscursosService } from './discursos.service';
import { DiscursosIngestion } from './discursos.ingestion';

@ApiTags('discursos')
@Controller('discursos')
export class DiscursosController {
  constructor(
    private readonly service: DiscursosService,
    private readonly ingestion: DiscursosIngestion,
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
      limit:  limit  ? Number(limit)  : 30,
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
  ingestRecent() { return this.ingestion.syncRecent(); }

  @Post('ingest/historical')
  ingestHistorical() { return this.ingestion.syncHistorical(); }
}
