import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { IngestionService } from './ingestion.service';
import { REDIS_CLIENT } from '../../infra/redis/redis.module';

const QUEUE_NAME = 'ingestion';

/**
 * Ingestion queue with graceful Redis fallback.
 * When Redis is available, uses BullMQ for persistent job queuing.
 * When Redis is NOT available, executes jobs directly (synchronous mode).
 */
@Injectable()
export class IngestionQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngestionQueue.name);
  private queue: any | null = null;
  private worker: any | null = null;
  private isProcessing = false;

  constructor(
    private readonly ingestion: IngestionService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {}

  async onModuleInit() {
    if (!this.redis || this.redis.status !== 'ready') {
      this.logger.warn('Redis not available — IngestionQueue running in direct-execution mode (no BullMQ)');
      return;
    }

    try {
      const { Queue, Worker } = await import('bullmq');
      const connection = this.redis.duplicate();

      this.queue = new Queue(QUEUE_NAME, { connection });
      this.worker = new Worker(
        QUEUE_NAME,
        async (job: any) => {
          this.logger.log(`processing job ${job.name}`);
          if (job.name === 'full-sync') return this.ingestion.runFullSync();
          return null;
        },
        { connection: connection.duplicate() },
      );
      this.worker.on('failed', (job: any, err: Error) =>
        this.logger.error(`job ${job?.id} failed: ${err.message}`),
      );
      this.logger.log('BullMQ queue initialized successfully');
    } catch (e: any) {
      this.logger.warn(`BullMQ init failed: ${e.message} — falling back to direct execution`);
      this.queue = null;
      this.worker = null;
    }
  }

  async enqueueFullSync(opts?: any) {
    // If BullMQ is available, use it
    if (this.queue) {
      return this.queue.add('full-sync', {}, {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        ...opts,
      });
    }

    // Direct execution fallback (no Redis)
    if (this.isProcessing) {
      this.logger.warn('Ingestion already running — skipping');
      return { id: 'direct-skipped' };
    }

    this.isProcessing = true;
    this.logger.log('Running ingestion directly (no BullMQ)');

    // Run async — don't block the caller
    this.ingestion.runFullSync()
      .then((result) => this.logger.log(`Direct ingestion done: ${JSON.stringify(result)}`))
      .catch((err) => this.logger.error(`Direct ingestion failed: ${err.message}`))
      .finally(() => { this.isProcessing = false; });

    return { id: 'direct-execution' };
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }
}
