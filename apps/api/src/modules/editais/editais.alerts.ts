import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';
import { EmailService } from '../notifications/email.service';

/**
 * Roda diariamente às 08h e envia alertas de editais
 * que encerram em 1, 3 ou 7 dias para membros com
 * assinatura da área 'editais' habilitada.
 */
@Injectable()
export class EditaisAlerts {
  private readonly logger = new Logger(EditaisAlerts.name);
  private readonly ALERT_DAYS = [1, 3, 7];

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly email: EmailService,
  ) {}

  @Cron(process.env.EDITAIS_ALERT_CRON ?? '0 8 * * *')
  async run() {
    this.logger.log('running editais alert check');
    let sent = 0;

    for (const days of this.ALERT_DAYS) {
      const { rows: editais } = await this.pool.query(
        `SELECT id, titulo, orgao, valor_estimado, url_fonte
           FROM editais
           WHERE situacao = 'aberto'
             AND data_proposta_fim::date = CURRENT_DATE + INTERVAL '${days} days'`,
      );
      if (!editais.length) continue;

      const { rows: recipients } = await this.pool.query(
        `SELECT u.email
           FROM app_users u
           JOIN user_subscriptions us ON us.user_id = u.id
           JOIN notification_areas na ON na.id = us.area_id
           WHERE na.slug = 'editais' AND us.enabled = true AND u.email IS NOT NULL`,
      );
      if (!recipients.length) continue;

      for (const edital of editais) {
        const valor = edital.valor_estimado
          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(edital.valor_estimado))
          : undefined;

        for (const { email: to } of recipients) {
          await this.email.send({
            to,
            subject: `⚠️ Edital encerra em ${days} dia(s): ${edital.titulo.slice(0, 60)}`,
            html: this.email.editalAlertHtml({
              titulo:   edital.titulo,
              orgao:    edital.orgao,
              daysLeft: days,
              url:      edital.url_fonte,
              valor,
            }),
          });
          sent++;
        }
      }
    }

    this.logger.log(`editais alerts done: ${sent} emails sent`);
    return { sent };
  }
}
