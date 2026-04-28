import { Controller, ForbiddenException, Headers, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IngestionQueue } from '../ingestion/ingestion.queue';
import { ClassifierService } from '../nlp/classifier.service';

/**
 * Endpoints administrativos. Protegidos por header `x-admin-token` comparado com
 * `ADMIN_TOKEN` (via .env). Em produção, substituir por auth/JWT/Cognito.
 */
@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly queue: IngestionQueue,
    private readonly classifier: ClassifierService,
  ) {}

  @Post('ingest')
  async triggerIngest(@Headers('x-admin-token') token?: string) {
    this.assertAuth(token);
    const job = await this.queue.enqueueFullSync();
    return { enqueued: true, jobId: job.id };
  }

  @Post('reclassify')
  async reclassify(
    @Headers('x-admin-token') token?: string,
    @Query('force') force?: string,
  ) {
    this.assertAuth(token);
    return this.classifier.reclassifyAll(force === 'true');
  }

  private assertAuth(token?: string) {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) throw new ForbiddenException('ADMIN_TOKEN não configurado no servidor');
    if (token !== expected) throw new ForbiddenException('token inválido');
  }
}
