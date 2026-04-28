import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PropositionsService } from '../services/propositions.service';

@ApiTags('propositions')
@Controller('propositions')
export class PropositionsController {
  constructor(private readonly service: PropositionsService) {}

  @Get()
  @ApiQuery({ name: 'type',   required: false })
  @ApiQuery({ name: 'year',   required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit',  required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  list(
    @Query('type') type?: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.list({
      type,
      year: year ? Number(year) : undefined,
      status,
      search,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get(':id')
  byId(@Param('id', ParseIntPipe) id: number) {
    return this.service.getById(id);
  }
}
