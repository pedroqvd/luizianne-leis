import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';
import { EmailService } from '../notifications/email.service';
import { EditaisRepository } from './editais.repository';
import { EditaisMatchingService } from './editais-matching.service';

/**
 * Roda diariamente às 08h:
 * 1. Expira editais vencidos e recalcula matches com prefeitos.
 * 2. Consolida um único digest por destinatário com editais que encerram em 1, 3 ou 7 dias,
 *    respeitando permissões de acesso à aba 'editais'.
 */
@Injectable()
export class EditaisAlerts {
  private readonly logger = new Logger(EditaisAlerts.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly email: EmailService,
    private readonly repo: EditaisRepository,
    private readonly matching: EditaisMatchingService,
  ) {}

  @Cron(process.env.EDITAIS_ALERT_CRON ?? '0 8 * * *')
  async run() {
    this.logger.log('running editais daily digest alert check');

    await this.repo.expirePastDueEditais();
    await this.matching.recomputeMatches();

    const { rows: editais } = await this.pool.query(
      `SELECT
         id,
         titulo,
         orgao,
         valor_estimado,
         url_fonte,
         (data_proposta_fim::date - CURRENT_DATE)::int AS days_left
       FROM editais
       WHERE situacao = 'aberto'
         AND (data_proposta_fim::date - CURRENT_DATE)::int IN (1, 3, 7)
       ORDER BY days_left ASC, valor_estimado DESC NULLS LAST
       LIMIT 50`,
    );

    if (!editais.length) {
      this.logger.log('no editais expiring in 1, 3, or 7 days today');
      return { sent: 0 };
    }

    const { rows: recipients } = await this.pool.query(
      `SELECT DISTINCT u.email
         FROM app_users u
         JOIN user_subscriptions us ON us.user_id = u.id
         JOIN notification_areas na ON na.id = us.area_id
        WHERE na.slug = 'editais'
          AND us.enabled = true
          AND u.email IS NOT NULL
          AND (
            u.role = 'admin'
            OR EXISTS (
              SELECT 1 FROM user_tab_permissions utp
               WHERE utp.user_id = u.id AND utp.tab_slug = 'editais'
            )
          )`,
    );

    if (!recipients.length) {
      return { sent: 0 };
    }

    const digestItems = editais.map((edital) => ({
      titulo: edital.titulo,
      orgao: edital.orgao,
      daysLeft: Number(edital.days_left),
      url: edital.url_fonte,
      valor: edital.valor_estimado
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            Number(edital.valor_estimado),
          )
        : undefined,
    }));

    const html = this.email.editalDigestHtml(digestItems);
    let sent = 0;

    for (const { email: to } of recipients) {
      await this.email.send({
        to,
        subject: `⚠️ Radar de Editais: ${digestItems.length} oportunidade(s) encerrando em breve`,
        html,
      });
      sent++;
    }

    this.logger.log(`editais digest alerts done: ${sent} emails sent (${digestItems.length} editais)`);
    return { sent };
  }
}
