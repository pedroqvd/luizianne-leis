import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Pool } from 'pg';
import { EmailService } from '../notifications/email.service';
import { PG_POOL } from '../../infra/database/database.module';

function escapeHtml(raw?: string | null): string {
  if (!raw) return '';
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseDueDate(due: unknown): Date | null {
  if (!due) return null;
  if (due instanceof Date) return Number.isNaN(due.getTime()) ? null : due;
  const iso = String(due).slice(0, 10);
  const parsed = new Date(`${iso}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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

      // Envia apenas para membros com acesso permitido à aba 'demandas'
      const { rows: recipients } = await this.pool.query(`
        SELECT u.email
          FROM app_users u
         WHERE u.email IS NOT NULL
           AND (
             u.role = 'admin'
             OR NOT EXISTS (
               SELECT 1
                 FROM user_tab_permissions utp
                WHERE utp.user_id = u.id
                  AND utp.tab_slug = 'demandas'
                  AND utp.enabled = false
             )
           )
      `);

      if (recipients.length === 0) return;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const overdue = pending.filter((d) => {
        const dt = parseDueDate(d.due_date);
        return dt !== null && dt < todayStart;
      });
      const html = this.buildHtml(pending, overdue.length, todayStart);

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

  private buildHtml(demands: any[], overdueCount: number, todayStart: Date): string {
    const PRIORITY_LABEL: Record<string, string> = {
      urgente: '🔴 Urgente',
      alta: '🟠 Alta',
      normal: '🟡 Normal',
      baixa: '⚪ Baixa',
    };
    const STATUS_LABEL: Record<string, string> = {
      novo: 'Novo',
      em_andamento: 'Em andamento',
      aguardando: 'Aguardando',
    };

    const rows = demands
      .map((d) => {
        const dt = parseDueDate(d.due_date);
        const dueTxt = dt
          ? dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : '—';
        const isOverdue = dt !== null && dt < todayStart;
        return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${escapeHtml(d.title)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${escapeHtml(PRIORITY_LABEL[d.priority] ?? d.priority)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${escapeHtml(STATUS_LABEL[d.status] ?? d.status)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:${isOverdue ? '#ef4444' : '#64748b'}">${escapeHtml(dueTxt)}${isOverdue ? ' ⚠️' : ''}</td>
      </tr>`;
      })
      .join('');

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
      Gabinete Parlamentar · Luizianne Lins
    </div>
  </div>
</body>
</html>`;
  }
}
