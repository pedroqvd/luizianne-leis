import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VotesService } from '../services/votes.service';

@ApiTags('votes')
@Controller('votes')
export class VotesController {
  constructor(private readonly service: VotesService) {}

  @Get()
  list(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.service.list(
      limit ? Number(limit) : 100,
      offset ? Number(offset) : 0,
    );
  }

  @Get(':proposition_id')
  byProposition(@Param('proposition_id', ParseIntPipe) id: number) {
    return this.service.byProposition(id);
  }
}
