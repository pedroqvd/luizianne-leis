import Link from 'next/link';
import { api } from '@/lib/api';
import { FileText, ExternalLink, Search, Filter, ChevronLeft, ChevronRight, Download, Scale, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

interface PropositionRow {
  id: number; external_id: number | null; type: string; number: number | null; year: number | null;
  title: string | null; status: string | null; presented_at: string | null; url: string | null;
  deputy_role: 'author' | 'coauthor' | 'rapporteur' | null;
}

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  author:     { label: 'Autora',    cls: 'bg-green-50 text-green-700 border-green-100' },
  coauthor:   { label: 'Coautora',  cls: 'bg-sky-50 text-sky-700 border-sky-100' },
  rapporteur: { label: 'Relatora',  cls: 'bg-amber-50 text-amber-700 border-amber-100' },
};

interface PropositionListResponse {
  rows: PropositionRow[];
  total: number;
}

/** Sempre retorna a URL correta do site da Câmara. Corrige dados antigos que
 *  tinham o endpoint da API (dadosabertos.camara.leg.br) em vez da página web. */
function camaraUrl(row: Pick<PropositionRow, 'url' | 'external_id'>): string | null {
  if (row.external_id) {
    return `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${row.external_id}`;
  }
  if (row.url) {
    const m = row.url.match(/\/proposicoes\/(\d+)/);
    if (m) return `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${m[1]}`;
    return row.url;
  }
  return null;
}

const TYPE_COLORS: Record<string, string> = {
  PL:  'bg-blue-50 text-blue-700 border-blue-100',   PEC: 'bg-purple-50 text-purple-700 border-purple-100',
  PLP: 'bg-indigo-50 text-indigo-700 border-indigo-100', REQ: 'bg-amber-50 text-amber-700 border-amber-100',
  INC: 'bg-slate-50 text-slate-600 border-slate-100',
};

export default async function LegislativoPage({
  searchParams,
}: {
  searchParams: { type?: string; year?: string; status?: string; role?: string; search?: string; page?: string };
}) {
  const parsedPage = Number(searchParams.page ?? 1);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const qs = new URLSearchParams();
  if (searchParams.type)   qs.set('type', searchParams.type);
  if (searchParams.year)   qs.set('year', searchParams.year);
  if (searchParams.status) qs.set('status', searchParams.status);
  if (searchParams.role)   qs.set('role', searchParams.role);
  if (searchParams.search) qs.set('search', searchParams.search);
  qs.set('limit', String(PAGE_SIZE));
  qs.set('offset', String(offset));

  let data: PropositionListResponse = { rows: [], total: 0 };
  let legData: PropositionListResponse = { rows: [], total: 0 };

  [data, legData] = await Promise.all([
    api<PropositionListResponse>(`/propositions?${qs}`)
      .then(resp => ({
        rows:  Array.isArray(resp?.rows)         ? resp.rows  : [],
        total: Number.isFinite(resp?.total) ? resp.total : 0,
      }))
      .catch(() => ({ rows: [], total: 0 })),
    api<PropositionListResponse>('/propositions?type=PEC&limit=30')
      .catch(() => ({ rows: [], total: 0 })),
  ]);

  const totalPages = data.total > 0 ? Math.ceil(data.total / PAGE_SIZE) : 0;

  function pageUrl(p: number) {
    const q = new URLSearchParams({ ...Object.fromEntries(qs), page: String(p) });
    q.delete('limit'); q.delete('offset');
    return `/legislativo?${q}`;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-title">Legislativo</h1>
          <p className="text-sm text-slate-500 mt-1">Proposições, relatorias e projetos da deputada</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
            {data.total} proposições
          </span>
          <a
            href={`/legislativo/export?${qs}`}
            className="btn-secondary text-xs py-1.5 flex items-center gap-1.5"
            title="Exportar CSV"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </a>
        </div>
      </div>

      {/* Filters */}
      <form className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input name="search" defaultValue={searchParams.search ?? ''} placeholder="Buscar por título…" className="input pl-9 text-xs" />
          </div>
          <select name="type" defaultValue={searchParams.type ?? ''} className="input w-auto text-xs">
            <option value="">Todos os tipos</option>
            {['PL','PEC','PLP','PDL','PDS','PRC','PLV','MPV','REQ','INC','EMC','EMP','REC','PFC'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select name="role" defaultValue={searchParams.role ?? ''} className="input w-auto text-xs">
            <option value="">Qualquer papel</option>
            <option value="autor">Autora</option>
            <option value="coautor">Coautora</option>
            <option value="relator">Relatora</option>
          </select>
          <input name="year" defaultValue={searchParams.year ?? ''} placeholder="Ano (ex: 2023)" className="input w-32 text-xs" />
          <button type="submit" className="btn-primary text-xs py-2">
            <Filter className="w-3.5 h-3.5" /> Filtrar
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
                      <span className={`badge border text-[10px] font-semibold ${TYPE_COLORS[p.type] ?? 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                        {p.type} {p.number}/{p.year}
                      </span>
                      {p.deputy_role && ROLE_LABELS[p.deputy_role] && (
                        <span className={`badge border text-[10px] font-medium ${ROLE_LABELS[p.deputy_role].cls}`}>
                          {ROLE_LABELS[p.deputy_role].label}
                        </span>
                      )}
                      {p.status && (
                        <span className="badge bg-slate-50 text-slate-500 border border-slate-100 text-[10px]">{p.status}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-1.5 line-clamp-2 leading-snug">{p.title ?? '—'}</p>
                    {p.presented_at && (
                      <p className="text-xs text-slate-400 mt-1">{new Date(p.presented_at).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(() => { const href = camaraUrl(p); return href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" title="Ver na Câmara"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : null; })()}
                    <Link href={`/legislativo/${p.id}`}
                      className="text-xs text-brand-700 hover:text-brand-800 font-medium sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
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

      {/* ── PECs (Propostas de Emenda à Constituição) ── */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
            <Scale className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Propostas de Emenda à Constituição (PEC)</h2>
            <p className="text-xs text-slate-500">PECs com autoria, coautoria ou relatoria da deputada</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'PEC (Proposta de Emenda à Constituição)', color: 'bg-purple-50 border-purple-200 text-purple-700', icon: Scale },
            { label: 'Emendas à PEC (EMC/EMP)',      color: 'bg-indigo-50 border-indigo-200 text-indigo-700', icon: FileText },
          ].map(({ label, color, icon: Icon }) => (
            <div key={label} className={`rounded-xl border px-4 py-3 flex items-center gap-2 text-sm font-medium ${color}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Últimas PECs
            </span>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              {legData.total} registros
            </span>
          </div>

          {legData.rows.length > 0 ? (
            <ul className="divide-y divide-slate-50">
              {legData.rows.map((p) => (
                <li key={p.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors group">
                  <div className="mt-0.5 p-1.5 bg-purple-50 rounded-lg flex-shrink-0">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded-md">
                        {p.type} {p.number}/{p.year}
                      </span>
                      {p.status && (
                        <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">{p.status}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-1 line-clamp-2 leading-snug">{p.title ?? '—'}</p>
                    {p.presented_at && (
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(p.presented_at).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(() => { const href = camaraUrl(p); return href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : null; })()}
                    <Link href={`/legislativo/${p.id}`}
                      className="text-xs text-brand-700 font-medium sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
                      Detalhes →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-12 text-center">
              <AlertCircle className="w-7 h-7 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Nenhuma PEC encontrada.</p>
              <p className="text-xs text-slate-300 mt-1">Rode a ingestão para popular os dados.</p>
            </div>
          )}
        </div>
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Mostrando {offset + 1}–{Math.min(offset + PAGE_SIZE, data.total)} de {data.total}
          </p>
          <div className="flex items-center gap-1">
            {page > 1 && (
              <Link href={pageUrl(page - 1)}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </Link>
            )}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <Link key={p} href={pageUrl(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    p === page ? 'bg-brand-700 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  {p}
                </Link>
              );
            })}
            {page < totalPages && (
              <Link href={pageUrl(page + 1)}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
