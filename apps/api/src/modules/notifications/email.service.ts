import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

function escapeHtml(raw?: string | number | null): string {
  if (raw === null || raw === undefined) return '';
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return escapeHtml(parsed.toString());
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Envia e-mails transacionais via Resend com sanitização contra HTML Injection.
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
    const url = safeUrl(p.url);
    return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:700">Luizianne Lins · Monitor Legislativo</span>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;padding:32px;border-radius:0 0 12px 12px">
    <h2 style="color:#0f172a;margin:0 0 8px">📄 Nova Proposição</h2>
    <p style="color:#475569;margin:0 0 16px">
      <strong>${escapeHtml(p.type)} ${escapeHtml(p.number)}/${escapeHtml(p.year)}</strong> foi apresentada.
    </p>
    <p style="color:#334155;line-height:1.6;margin:0 0 24px">${escapeHtml(p.title)}</p>
    ${url ? `<a href="${url}" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ver na Câmara →</a>` : ''}
  </div>
</div>`;
  }

  editalAlertHtml(e: { titulo: string; orgao: string; daysLeft: number; url?: string; valor?: string }) {
    const urgency = e.daysLeft <= 3 ? '🔴' : e.daysLeft <= 7 ? '🟡' : '🟢';
    const url = safeUrl(e.url);
    return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:700">Luizianne Lins · Monitor de Editais</span>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;padding:32px;border-radius:0 0 12px 12px">
    <h2 style="color:#0f172a;margin:0 0 8px">${urgency} Edital encerrando em ${escapeHtml(e.daysLeft)} dia(s)</h2>
    <p style="color:#334155;font-weight:600;margin:0 0 4px">${escapeHtml(e.titulo)}</p>
    <p style="color:#64748b;margin:0 0 16px">${escapeHtml(e.orgao)}</p>
    ${e.valor ? `<p style="color:#059669;font-weight:700;margin:0 0 16px">Valor: ${escapeHtml(e.valor)}</p>` : ''}
    ${url ? `<a href="${url}" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ver no PNCP →</a>` : ''}
  </div>
</div>`;
  }

  editalDigestHtml(items: Array<{ titulo: string; orgao: string; daysLeft: number; url?: string; valor?: string; matchedMayors?: number }>) {
    const rows = items.map((e) => {
      const urgency = e.daysLeft <= 3 ? '🔴' : e.daysLeft <= 7 ? '🟡' : '🟢';
      const url = safeUrl(e.url);
      const matchBadge = e.matchedMayors
        ? `<span style="background:#eff6ff;color:#1d4ed8;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600">🎯 ${e.matchedMayors} prefeito(s)</span>`
        : '';
      return `
      <div style="border-bottom:1px solid #f1f5f9;padding:14px 0">
        <div style="font-size:12px;color:#64748b;margin-bottom:4px">
          <strong>${urgency} Encerra em ${escapeHtml(e.daysLeft)}d</strong> · ${escapeHtml(e.orgao)} ${matchBadge}
        </div>
        <div style="font-size:14px;font-weight:600;color:#0f172a;margin-bottom:6px">${escapeHtml(e.titulo)}</div>
        <div style="font-size:12px;color:#059669;font-weight:600">
          ${e.valor ? `Valor estimado: ${escapeHtml(e.valor)} · ` : ''}
          ${url ? `<a href="${url}" style="color:#dc2626;text-decoration:none">Abrir no PNCP →</a>` : ''}
        </div>
      </div>`;
    }).join('');

    return `
<div style="font-family:sans-serif;max-width:640px;margin:0 auto">
  <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:700">Luizianne Lins · Radar Diário de Editais</span>
    <p style="color:#94a3b8;margin:4px 0 0;font-size:13px">${items.length} edital(is) com prazo próximo de encerramento</p>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;padding:24px 32px;border-radius:0 0 12px 12px">
    ${rows}
  </div>
</div>`;
  }

  statusChangedHtml(p: { title: string; type: string; number: number; year: number; status: string; url?: string }) {
    const url = safeUrl(p.url);
    return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:700">Luizianne Lins · Monitor Legislativo</span>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;padding:32px;border-radius:0 0 12px 12px">
    <h2 style="color:#0f172a;margin:0 0 8px">🔄 Status Atualizado</h2>
    <p style="color:#475569;margin:0 0 8px"><strong>${escapeHtml(p.type)} ${escapeHtml(p.number)}/${escapeHtml(p.year)}</strong></p>
    <p style="color:#334155;margin:0 0 16px">${escapeHtml(p.title)}</p>
    <p style="margin:0 0 24px">Novo status: <strong style="color:#dc2626">${escapeHtml(p.status)}</strong></p>
    ${url ? `<a href="${url}" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ver na Câmara →</a>` : ''}
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
    <p style="color:#991b1b;font-weight:600;margin:0 0 8px">A parlamentar não registrou voto nesta votação nominal.</p>
    <p style="color:#334155;margin:0 0 8px"><strong>Proposição:</strong> ${escapeHtml(p.proposition_title)}</p>
    <p style="color:#64748b;margin:0 0 8px"><strong>Sessão:</strong> ${escapeHtml(p.session_id)}</p>
    <p style="color:#64748b;margin:0 0 24px"><strong>Data/hora:</strong> ${escapeHtml(dateStr)}</p>
    <p style="color:#94a3b8;font-size:12px">Verifique o registro de presença e se houve justificativa de ausência.</p>
  </div>
</div>`;
  }

  approvedLawHtml(p: { title: string; type: string; number: number; year: number; status: string; url?: string }) {
    const url = safeUrl(p.url);
    return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#14532d;padding:24px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:700">✅ Luizianne Lins · Lei Aprovada</span>
  </div>
  <div style="background:#fff;border:1px solid #bbf7d0;padding:32px;border-radius:0 0 12px 12px">
    <h2 style="color:#14532d;margin:0 0 8px">Proposição aprovada!</h2>
    <p style="color:#475569;margin:0 0 8px"><strong>${escapeHtml(p.type)} ${escapeHtml(p.number)}/${escapeHtml(p.year)}</strong></p>
    <p style="color:#334155;margin:0 0 16px">${escapeHtml(p.title)}</p>
    <p style="margin:0 0 24px">Status: <strong style="color:#16a34a">${escapeHtml(p.status)}</strong></p>
    ${url ? `<a href="${url}" style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ver na Câmara →</a>` : ''}
  </div>
</div>`;
  }
}
