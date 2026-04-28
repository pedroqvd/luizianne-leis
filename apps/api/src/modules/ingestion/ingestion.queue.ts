import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { IngestionService } from './ingestion.service';

const QUEUE_NAME = 'ingestion';

/**
 * BullMQ queue para a ingestão. Expõe um método enqueue() para acionar
 * sincronizações sob demanda, sem bloquear a request.
 */
@Injectable()
export class IngestionQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngestionQueue.name);
  private queue!: Queue;
  private worker!: Worker;
  private connection!: IORedis;

  constructor(private readonly ingestion: IngestionService) {}

  onModuleInit() {
    this.connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue(QUEUE_NAME, { connection: this.connection });
    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        this.logger.log(`processing job ${job.name}`);
        if (job.name === 'full-sync') return this.ingestion.runFullSync();
        return null;
      },
      { connection: this.connection },
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
    await this.connection?.quit();
  }
}
