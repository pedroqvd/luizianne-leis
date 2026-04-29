import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { EditaisService } from './editais.service';

@ApiTags('editais')
@Controller('editais')
export class EditaisController {
  constructor(private readonly service: EditaisService) {}

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @Get('ministries')
  ministries() {
    return this.service.ministries();
  }

  @Get()
  @ApiQuery({ name: 'situacao',      required: false })
  @ApiQuery({ name: 'ministerio',    required: false })
  @ApiQuery({ name: 'modalidade',    required: false })
  @ApiQuery({ name: 'uf',            required: false })
  @ApiQuery({ name: 'search',        required: false })
  @ApiQuery({ name: 'encerrandoEm', required: false, description: 'Encerrando nos próximos N dias' })
  @ApiQuery({ name: 'limit',         required: false })
  @ApiQuery({ name: 'offset',        required: false })
  list(
    @Query('situacao')     situacao?: string,
    @Query('ministerio')   ministerio?: string,
    @Query('modalidade')   modalidade?: string,
    @Query('uf')           uf?: string,
    @Query('search')       search?: string,
    @Query('encerrandoEm') encerrandoEm?: string,
    @Query('limit')        limit?: string,
    @Query('offset')       offset?: string,
  ) {
    return this.service.list({
      situacao, ministerio, modalidade, uf, search,
      encerrandoEm: encerrandoEm ? Number(encerrandoEm) : undefined,
      limit:  limit  ? Number(limit)  : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }
}
