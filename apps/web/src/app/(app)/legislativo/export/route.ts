import { api } from '@/lib/api';
import { requireTabAccess } from '@/lib/auth-guard';
import { NextRequest, NextResponse } from 'next/server';

const MAX_CSV_ROWS = 500;

function sanitizeCsvCell(v: any): string {
  let str = String(v ?? '');
  // Neutraliza CSV Formula Injection (Excel/Calc) se iniciar com =, +, -, @, tab ou CR
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  await requireTabAccess('legislativo');

  const { searchParams } = new URL(req.url);
  const qs = new URLSearchParams();
  ['type', 'year', 'status', 'role', 'search'].forEach((k) => {
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

  const header = ['ID', 'Tipo', 'Número', 'Ano', 'Papel', 'Título', 'Status', 'Apresentada em', 'URL'];

  const csv = [
    header.join(','),
    ...rows.map((p) =>
      [p.id, p.type, p.number, p.year, p.deputy_role ?? '', p.title, p.status, p.presented_at, p.url]
        .map(sanitizeCsvCell)
        .join(','),
    ),
  ].join('\r\n');

  const truncated = rows.length >= MAX_CSV_ROWS;

  return new NextResponse('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="proposicoes.csv"',
      'Cache-Control': 'private, no-store',
      ...(truncated ? { 'X-Truncated': `true; max=${MAX_CSV_ROWS}` } : {}),
    },
  });
}
