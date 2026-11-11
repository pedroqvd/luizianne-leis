import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../infra/auth';
import { CommissionsService } from './commissions.service';

@ApiTags('commissions')
@Public()
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly service: CommissionsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('target')
  forTarget() {
    return this.service.forTarget();
  }

  @Get('deputy/:id')
  forDeputy(@Param('id', ParseIntPipe) id: number) {
    return this.service.forDeputy(id);
  }
}
