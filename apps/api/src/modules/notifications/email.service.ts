import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

/**
 * Envia e-mails transacionais via Resend.
 * Requer RESEND_API_KEY e EMAIL_FROM no ambiente.
 * Em dev/test (sem API key), apenas loga — não lança erro.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor() {
    const key = process.env.RESEND_API_KEY;
    this.resend = key ? new Resend(key) : null;
    this.from = process.env.EMAIL_FROM ?? 'noreply@luizianne-leis.vercel.app';
    if (!key) this.logger.warn('RESEND_API_KEY not set — email disabled');
  }

  async send(opts: { to: string | string[]; subject: string; html: string }): Promise<void> {
    if (!this.resend) {
      this.logger.debug(`[email skip] to=${opts.to} subject="${opts.subject}"`);
      return;
    }
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
      });
      if (error) this.logger.warn(`Resend error: ${JSON.stringify(error)}`);
      else this.logger.log(`email sent to ${opts.to}`);
    } catch (e: any) {
      this.logger.error(`email failed: ${e.message}`);
    }
  }

  /* ── Templates ─────────────────────────────────────────────────── */

  newPropositionHtml(p: { title: string; type: string; number: number; year: number; url?: string }) {
    return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:700">Luizianne Lins · Monitor Legislativo</span>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;padding:32px;border-radius:0 0 12px 12px">
    <h2 style="color:#0f172a;margin:0 0 8px">📄 Nova Proposição</h2>
    <p style="color:#475569;margin:0 0 16px">
      <strong>${p.type} ${p.number}/${p.year}</strong> foi apresentada.
    </p>
    <p style="color:#334155;line-height:1.6;margin:0 0 24px">${p.title}</p>
    ${p.url ? `<a href="${p.url}" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ver na Câmara →</a>` : ''}
  </div>
</div>`;
  }

  editalAlertHtml(e: { titulo: string; orgao: string; daysLeft: number; url?: string; valor?: string }) {
    const urgency = e.daysLeft <= 3 ? '🔴' : e.daysLeft <= 7 ? '🟡' : '🟢';
    return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:700">Luizianne Lins · Monitor de Editais</span>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;padding:32px;border-radius:0 0 12px 12px">
    <h2 style="color:#0f172a;margin:0 0 8px">${urgency} Edital encerrando em ${e.daysLeft} dia(s)</h2>
    <p style="color:#334155;font-weight:600;margin:0 0 4px">${e.titulo}</p>
    <p style="color:#64748b;margin:0 0 16px">${e.orgao}</p>
    ${e.valor ? `<p style="color:#059669;font-weight:700;margin:0 0 16px">Valor: ${e.valor}</p>` : ''}
    ${e.url ? `<a href="${e.url}" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ver no PNCP →</a>` : ''}
  </div>
</div>`;
  }

  statusChangedHtml(p: { title: string; type: string; number: number; year: number; status: string; url?: string }) {
    return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:700">Luizianne Lins · Monitor Legislativo</span>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;padding:32px;border-radius:0 0 12px 12px">
    <h2 style="color:#0f172a;margin:0 0 8px">🔄 Status Atualizado</h2>
    <p style="color:#475569;margin:0 0 8px"><strong>${p.type} ${p.number}/${p.year}</strong></p>
    <p style="color:#334155;margin:0 0 16px">${p.title}</p>
    <p style="margin:0 0 24px">Novo status: <strong style="color:#dc2626">${p.status}</strong></p>
    ${p.url ? `<a href="${p.url}" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ver na Câmara →</a>` : ''}
  </div>
</div>`;
  }

  absenceHtml(p: { proposition_title: string; session_id: string; date?: string | null }) {
    const dateStr = p.date
      ? new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '—';
    return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#7f1d1d;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:700">⚠️ Ausência em Votação Nominal</span>
  </div>
  <div style="background:#fff;border:1px solid #fecaca;padding:32px;border-radius:0 0 12px 12px">
    <p style="color:#991b1b;font-weight:600;margin:0 0 8px">A deputada não registrou voto nesta votação nominal.</p>
    <p style="color:#334155;margin:0 0 8px"><strong>Proposição:</strong> ${p.proposition_title}</p>
    <p style="color:#64748b;margin:0 0 8px"><strong>Sessão:</strong> ${p.session_id}</p>
    <p style="color:#64748b;margin:0 0 24px"><strong>Data/hora:</strong> ${dateStr}</p>
    <p style="color:#94a3b8;font-size:12px">Verifique o registro de presença e se houve justificativa de ausência.</p>
  </div>
</div>`;
  }

  approvedLawHtml(p: { title: string; type: string; number: number; year: number; status: string; url?: string }) {
    return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#14532d;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:700">✅ Luizianne Lins · Lei Aprovada</span>
  </div>
  <div style="background:#fff;border:1px solid #bbf7d0;padding:32px;border-radius:0 0 12px 12px">
    <h2 style="color:#14532d;margin:0 0 8px">Proposição aprovada!</h2>
    <p style="color:#475569;margin:0 0 8px"><strong>${p.type} ${p.number}/${p.year}</strong></p>
    <p style="color:#334155;margin:0 0 16px">${p.title}</p>
    <p style="margin:0 0 24px">Status: <strong style="color:#16a34a">${p.status}</strong></p>
    ${p.url ? `<a href="${p.url}" style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ver na Câmara →</a>` : ''}
  </div>
</div>`;
  }
}
