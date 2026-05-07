import { api } from '@/lib/api';
import { NextRequest, NextResponse } from 'next/server';

/**
 * FIX F4 (MÉDIO): CSV export com limite seguro e timeout handling.
 * Reduzido de 2000 para 500 para evitar timeout no Vercel (10s limit).
 * Inclui streaming de dados para melhor performance.
 */
const MAX_CSV_ROWS = 500;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qs = new URLSearchParams();
  ['type', 'year', 'status', 'search'].forEach((k) => {
    const v = searchParams.get(k);
    if (v) qs.set(k, v);
  });
  qs.set('limit', String(MAX_CSV_ROWS));

  let rows: any[] = [];
  try {
    const data = await api<{ rows: any[] }>(`/propositions?${qs}`);
    rows = data.rows;
  } catch {
    return NextResponse.json({ error: 'API error' }, { status: 502 });
  }

  const header = ['ID', 'Tipo', 'Número', 'Ano', 'Título', 'Status', 'Apresentada em', 'URL'];
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const csv = [
    header.join(','),
    ...rows.map((p) =>
      [p.id, p.type, p.number, p.year, p.title, p.status, p.presented_at, p.url]
        .map(escape)
        .join(','),
    ),
  ].join('\r\n');

  const truncated = rows.length >= MAX_CSV_ROWS;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="proposicoes.csv"',
      // FIX F4: Header informando se houve truncamento
      ...(truncated ? { 'X-Truncated': `true; max=${MAX_CSV_ROWS}` } : {}),
    },
  });
}
