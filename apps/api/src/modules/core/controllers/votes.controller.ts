import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { VotesService } from '../services/votes.service';

@ApiTags('votes')
@Controller('votes')
export class VotesController {
  constructor(private readonly service: VotesService) {}

  @Get()
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'absencesOnly', required: false, description: 'true para listar só ausências' })
  list(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('absencesOnly') absencesOnly?: string,
  ) {
    return this.service.list(
      limit ? Number(limit) : 200,
      offset ? Number(offset) : 0,
      absencesOnly === 'true',
    );
  }

  @Get('stats/target')
  async statsTarget() {
    return this.service.statsTarget();
  }

  @Get('stats/:deputy_id')
  stats(@Param('deputy_id', ParseIntPipe) id: number) {
    return this.service.stats(id);
  }

  @Get(':proposition_id')
  byProposition(@Param('proposition_id', ParseIntPipe) id: number) {
    return this.service.byProposition(id);
  }
}
