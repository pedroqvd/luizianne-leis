import { api } from '@/lib/api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qs = new URLSearchParams();
  ['type', 'year', 'status', 'search'].forEach((k) => {
    const v = searchParams.get(k);
    if (v) qs.set(k, v);
  });
  qs.set('limit', '2000');

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

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="proposicoes.csv"',
    },
  });
}
