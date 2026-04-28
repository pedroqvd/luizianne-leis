import Link from 'next/link';
import { api } from '@/lib/api';

export const revalidate = 30;

interface PropositionListResponse {
  rows: Array<{
    id: number;
    type: string;
    number: number | null;
    year: number | null;
    title: string | null;
    status: string | null;
    presented_at: string | null;
  }>;
  total: number;
}

export default async function PropositionsPage({
  searchParams,
}: {
  searchParams: { type?: string; year?: string; status?: string; search?: string };
}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) if (v) qs.set(k, v);
  qs.set('limit', '100');

  let data: PropositionListResponse = { rows: [], total: 0 };
  try {
    data = await api<PropositionListResponse>(`/propositions?${qs.toString()}`);
  } catch {}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Proposições</h1>

      <form className="flex flex-wrap gap-2 text-sm">
        <input name="type"   defaultValue={searchParams.type ?? ''}   placeholder="Tipo (PL, PEC...)" className="border rounded px-2 py-1" />
        <input name="year"   defaultValue={searchParams.year ?? ''}   placeholder="Ano"               className="border rounded px-2 py-1 w-24" />
        <input name="status" defaultValue={searchParams.status ?? ''} placeholder="Status"            className="border rounded px-2 py-1" />
        <input name="search" defaultValue={searchParams.search ?? ''} placeholder="Buscar por título" className="border rounded px-2 py-1 flex-1" />
        <button className="bg-brand-500 text-white rounded px-3 py-1">Filtrar</button>
      </form>

      <div className="text-xs text-zinc-500">{data.total} resultado(s)</div>

      <ul className="divide-y divide-zinc-200 bg-white border border-zinc-200 rounded-lg">
        {data.rows.map((p) => (
          <li key={p.id} className="p-4 hover:bg-zinc-50">
            <Link href={`/propositions/${p.id}`} className="block">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium">
                  {p.type} {p.number}/{p.year}
                </span>
                <span className="text-xs text-zinc-500">{p.status ?? '—'}</span>
              </div>
              <div className="text-sm text-zinc-700 mt-1 line-clamp-2">{p.title}</div>
            </Link>
          </li>
        ))}
        {!data.rows.length && (
          <li className="p-6 text-center text-sm text-zinc-500">Nenhuma proposição encontrada.</li>
        )}
      </ul>
    </div>
  );
}
