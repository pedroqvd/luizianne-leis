import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Pool } from 'pg';
import { EmailService } from '../notifications/email.service';
import { PG_POOL } from '../../infra/database/database.module';

@Injectable()
export class DemandsReminderService {
  private readonly logger = new Logger(DemandsReminderService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly email: EmailService,
  ) {}

  // Every Monday at 08:00 BRT (11:00 UTC)
  @Cron('0 11 * * 1')
  async sendWeeklyReminder() {
    this.logger.log('Running weekly demands reminder');
    try {
      const { rows: pending } = await this.pool.query(`
        SELECT id, title, status, priority, due_date
        FROM demands
        WHERE status NOT IN ('resolvido', 'arquivado')
        ORDER BY
          CASE priority WHEN 'urgente' THEN 1 WHEN 'alta' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
          due_date ASC NULLS LAST
        LIMIT 50
      `);

      if (pending.length === 0) {
        this.logger.log('No pending demands — skipping reminder email');
        return;
      }

      const { rows: recipients } = await this.pool.query(`
        SELECT email FROM app_users WHERE email IS NOT NULL
      `);

      if (recipients.length === 0) return;

      const overdue = pending.filter(d => d.due_date && new Date(d.due_date) < new Date());
      const html = this.buildHtml(pending, overdue.length);

      for (const { email: to } of recipients) {
        try {
          await this.email.send({
            to,
            subject: `📋 Resumo semanal de demandas — ${pending.length} pendente${pending.length !== 1 ? 's' : ''}${overdue.length ? ` (${overdue.length} vencida${overdue.length !== 1 ? 's' : ''})` : ''}`,
            html,
          });
        } catch (e: any) {
          this.logger.warn(`Weekly reminder failed for ${to}: ${e.message}`);
        }
      }
    } catch (e: any) {
      this.logger.error(`Weekly demands reminder failed: ${e.message}`);
    }
  }

  private buildHtml(demands: any[], overdueCount: number): string {
    const PRIORITY_LABEL: Record<string, string> = {
      urgente: '🔴 Urgente', alta: '🟠 Alta', normal: '🟡 Normal', baixa: '⚪ Baixa',
    };
    const STATUS_LABEL: Record<string, string> = {
      novo: 'Novo', em_andamento: 'Em andamento', aguardando: 'Aguardando',
    };

    const rows = demands.map(d => {
      const dueTxt = d.due_date
        ? new Date(d.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '—';
      const isOverdue = d.due_date && new Date(d.due_date) < new Date();
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${d.title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${PRIORITY_LABEL[d.priority] ?? d.priority}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${STATUS_LABEL[d.status] ?? d.status}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:${isOverdue ? '#ef4444' : '#64748b'}">${dueTxt}${isOverdue ? ' ⚠️' : ''}</td>
      </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:32px">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#1e3a5f;padding:24px 32px">
      <h1 style="color:#fff;margin:0;font-size:18px">Resumo Semanal de Demandas</h1>
      <p style="color:#94a3b8;margin:4px 0 0;font-size:13px">${demands.length} demanda${demands.length !== 1 ? 's' : ''} pendente${demands.length !== 1 ? 's' : ''}${overdueCount ? ` · ${overdueCount} vencida${overdueCount !== 1 ? 's' : ''}` : ''}</p>
    </div>
    <div style="padding:24px 32px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#94a3b8">Demanda</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#94a3b8">Prioridade</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#94a3b8">Status</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#94a3b8">Prazo</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8">
      Gabinete da Deputada Federal Luizianne Lins
    </div>
  </div>
</body>
</html>`;
  }
}
