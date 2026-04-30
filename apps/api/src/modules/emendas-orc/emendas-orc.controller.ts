import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { EmendasOrcService } from './emendas-orc.service';

@ApiTags('emendas-orc')
@Controller('emendas-orc')
export class EmendasOrcController {
  constructor(private readonly service: EmendasOrcService) {}

  @Get()
  @ApiQuery({ name: 'ano',    required: false })
  @ApiQuery({ name: 'tipo',   required: false })
  @ApiQuery({ name: 'uf',     required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit',  required: false })
  @ApiQuery({ name: 'offset', required: false })
  list(
    @Query('ano')    ano?: string,
    @Query('tipo')   tipo?: string,
    @Query('uf')     uf?: string,
    @Query('search') search?: string,
    @Query('limit')  limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.list({
      ano:    ano    ? Number(ano)    : undefined,
      tipo,
      uf,
      search,
      limit:  limit  ? Number(limit)  : 60,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('stats')
  stats() { return this.service.stats(); }

  @Get('by-year')
  byYear() { return this.service.byYear(); }

  @Get('by-funcao')
  byFuncao() { return this.service.byFuncao(); }

  @Get('by-uf')
  byUf() { return this.service.byUf(); }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }
}
