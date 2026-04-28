import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeputyService } from '../services/deputy.service';

@ApiTags('deputy')
@Controller('deputy')
export class DeputyController {
  constructor(private readonly service: DeputyService) {}

  @Get()
  get() {
    return this.service.getTarget();
  }
}
