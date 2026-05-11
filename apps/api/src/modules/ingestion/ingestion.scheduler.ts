import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IngestionQueue } from './ingestion.queue';
import { AbsenceTrackerService } from './absence-tracker.service';
import { LawsAlertService } from './laws-alert.service';

@Injectable()
export class IngestionScheduler {
  private readonly logger = new Logger(IngestionScheduler.name);

  constructor(
    private readonly queue: IngestionQueue,
    private readonly absence: AbsenceTrackerService,
    private readonly laws: LawsAlertService,
  ) {}

  /**
   * Sincronização completa: proposições, relatorias, tramitações, votos.
   * Default: 2× ao dia (6h e 18h) em vez de a cada 30 min.
   * Cada full sync pode fazer centenas de requisições à API da Câmara.
   * Rode mais frequente via INGESTION_CRON se necessário (ex.: "0 *\/2 * * *" = a cada 2h).
   */
  @Cron(process.env.INGESTION_CRON ?? '0 6,18 * * *')
  async tick() {
    this.logger.log('cron tick — enqueue full sync');
    await this.queue.enqueueFullSync();
  }

  /**
   * Verificação de ausências em votações nominais.
   * Default: 1× ao dia (às 20h, após encerramento das sessões).
   * Usa janela de 3 dias para cobrir sessões noturnas e feriados.
   * Rode mais frequente via ABSENCE_CRON se necessário.
   */
  @Cron(process.env.ABSENCE_CRON ?? '0 20 * * *')
  async absenceTick() {
    this.logger.log('cron tick — checking absences in nominal votes');
    try {
      const result = await this.absence.checkRecentAbsences(3);
      this.logger.log(`absence check: ${result.checked} votações, ${result.absences} ausências`);
    } catch (e: any) {
      this.logger.error(`absence check failed: ${e.message}`);
    }
  }

  /** Alerta de leis aprovadas — toda segunda-feira às 09h */
  @Cron(process.env.LAWS_ALERT_CRON ?? '0 9 * * 1')
  async lawsAlertTick() {
    this.logger.log('cron tick — checking approved laws');
    try {
      const result = await this.laws.checkApprovedLaws();
      this.logger.log(`laws alert: ${result.found} aprovadas encontradas`);
    } catch (e: any) {
      this.logger.error(`laws alert failed: ${e.message}`);
    }
  }
}
