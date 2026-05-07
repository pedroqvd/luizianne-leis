import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, JobsOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { IngestionService } from './ingestion.service';
import { REDIS_CLIENT } from '../../infra/redis/redis.module';

const QUEUE_NAME = 'ingestion';

/**
 * BullMQ queue para a ingestão. Expõe um método enqueue() para acionar
 * sincronizações sob demanda, sem bloquear a request.
 *
 * FIX #10 (ALTO): TLS com rejectUnauthorized herdado do RedisModule.
 * FIX #16 (MÉDIO): Reutiliza a conexão Redis do módulo global em vez de criar nova.
 */
@Injectable()
export class IngestionQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngestionQueue.name);
  private queue!: Queue;
  private worker!: Worker;

  constructor(
    private readonly ingestion: IngestionService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  onModuleInit() {
    // FIX #16: Reutilizar conexão Redis global — BullMQ cria sub-conexões por conta
    // usando a mesma config. Passamos connection como o ioredis instance duplicado.
    const connection = this.redis.duplicate();

    this.queue = new Queue(QUEUE_NAME, { connection });
    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        this.logger.log(`processing job ${job.name}`);
        if (job.name === 'full-sync') return this.ingestion.runFullSync();
        return null;
      },
      { connection: connection.duplicate() }, // Worker needs its own connection
    );
    this.worker.on('failed', (job, err) =>
      this.logger.error(`job ${job?.id} failed: ${err.message}`),
    );
  }

  async enqueueFullSync(opts?: JobsOptions) {
    return this.queue.add('full-sync', {}, {
      removeOnComplete: 50,
      removeOnFail: 100,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      ...opts,
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }
}
