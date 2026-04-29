import Link from 'next/link';
import { api } from '@/lib/api';
import { FileText, ExternalLink, Search, Filter } from 'lucide-react';

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
    url: string | null;
  }>;
  total: number;
}

const TYPE_COLORS: Record<string, string> = {
  PL:   'bg-blue-50 text-blue-700 border-blue-100',
  PEC:  'bg-purple-50 text-purple-700 border-purple-100',
  PLP:  'bg-indigo-50 text-indigo-700 border-indigo-100',
  REQ:  'bg-amber-50 text-amber-700 border-amber-100',
  INC:  'bg-slate-50 text-slate-700 border-slate-100',
};

function typeBadge(type: string) {
  return TYPE_COLORS[type] ?? 'bg-slate-50 text-slate-600 border-slate-100';
}

export default async function LegislativoPage({
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
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Legislativo</h1>
          <p className="text-sm text-slate-500 mt-1">
            Proposições, relatorias e projetos da deputada
          </p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
          {data.total} proposições
        </span>
      </div>

      {/* Filters */}
      <form className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              name="search"
              defaultValue={searchParams.search ?? ''}
              placeholder="Buscar por título…"
              className="input pl-9 text-xs"
            />
          </div>
          <select name="type" defaultValue={searchParams.type ?? ''} className="input w-auto text-xs">
            <option value="">Todos os tipos</option>
            {['PL', 'PEC', 'PLP', 'REQ', 'INC'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            name="year"
            defaultValue={searchParams.year ?? ''}
            placeholder="Ano"
            className="input w-24 text-xs"
          />
          <input
            name="status"
            defaultValue={searchParams.status ?? ''}
            placeholder="Status"
            className="input w-36 text-xs"
          />
          <button type="submit" className="btn-primary text-xs py-2">
            <Filter className="w-3.5 h-3.5" />
            Filtrar
          </button>
        </div>
      </form>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
        {data.rows.length > 0 ? (
          <ul className="divide-y divide-slate-50">
            {data.rows.map((p) => (
              <li key={p.id} className="p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge border text-[10px] font-semibold ${typeBadge(p.type)}`}>
                        {p.type} {p.number}/{p.year}
                      </span>
                      {p.status && (
                        <span className="badge bg-slate-50 text-slate-500 border border-slate-100 text-[10px]">
                          {p.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-1.5 line-clamp-2 leading-snug">
                      {p.title ?? '—'}
                    </p>
                    {p.presented_at && (
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(p.presented_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver na Câmara dos Deputados"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Link
                      href={`/propositions/${p.id}`}
                      className="text-xs text-brand-700 hover:text-brand-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Detalhes →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-16 text-center">
            <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nenhuma proposição encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
