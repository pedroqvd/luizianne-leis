import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../../infra/auth';
import { DeputyService } from '../services/deputy.service';

@ApiTags('deputy')
@Public()
@Controller('deputy')
export class DeputyController {
  constructor(private readonly service: DeputyService) {}

  @Get()
  get() {
    return this.service.getTarget();
  }
}
