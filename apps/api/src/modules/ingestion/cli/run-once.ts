/**
 * CLI para rodar a ingestão uma vez (ex.: cron externo, primeira carga).
 *   ts-node src/modules/ingestion/cli/run-once.ts
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { IngestionService } from '../ingestion.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const svc = app.get(IngestionService);
  const summary = await svc.runFullSync();
  console.log('summary:', summary);
  await app.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
