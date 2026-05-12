import { api } from '@/lib/api';
import Link from 'next/link';
import { Mic, ChevronLeft, ChevronRight, ExternalLink, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

interface DiscursoRow {
  id: number;
  data_hora_inicio: string;
  data_hora_fim: string | null;
  fase: string | null;
  tipo: string | null;
  keywords: string | null;
  sumario: string | null;
  url_texto: string | null;
  url_audio: string | null;
  url_video: string | null;
}

interface DiscursosStats {
  total: string;
  anos: string;
  tipos: string;
  primeiro: string | null;
  ultimo: string | null;
}

interface ByYear { ano: number; total: number }
interface ByTipo { tipo: string; total: number }

function fmt(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(d?: string | null) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function buildHref(params: { ano?: string; tipo?: string; search?: string; page?: number }) {
  const p = new URLSearchParams();
  if (params.ano) p.set('ano', params.ano);
  if (params.tipo) p.set('tipo', params.tipo);
  if (params.search) p.set('search', params.search);
  if (params.page && params.page > 1) p.set('page', String(params.page));
  const qs = p.toString();
  return `/discursos${qs ? `?${qs}` : ''}`;
}

export default async function DiscursosPage({
  searchParams,
}: {
  searchParams: { ano?: string; tipo?: string; search?: string; page?: string };
}) {
  const { ano, tipo, search } = searchParams;
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  const qs = new URLSearchParams();
  if (ano) qs.set('ano', ano);
  if (tipo) qs.set('tipo', tipo);
  if (search) qs.set('search', search);
  qs.set('limit', String(PAGE_SIZE));
  qs.set('offset', String(offset));

  const [listData, stats, byYear, byTipo] = await Promise.all([
    api<{ rows: DiscursoRow[]; total: number }>(`/discursos?${qs}`).catch(() => ({ rows: [], total: 0 })),
    api<DiscursosStats>('/discursos/stats').catch(() => null),
    api<ByYear[]>('/discursos/by-year').catch(() => [] as ByYear[]),
    api<ByTipo[]>('/discursos/by-tipo').catch(() => [] as ByTipo[]),
  ]);

  const total = listData.total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const maxYear = byYear.length > 0 ? (Math.max(...byYear.map(y => y.total)) || 1) : 1;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="page-title">Discursos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pronunciamentos da deputada no Plenário da Câmara dos Deputados
        </p>
      </div>

      {/* Stats */}
      {stats && Number(stats.total) > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card text-center py-4">
            <p className="text-2xl font-bold text-slate-700">{Number(stats.total).toLocaleString('pt-BR')}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total de discursos</p>
          </div>
          <div className="stat-card text-center py-4">
            <p className="text-2xl font-bold text-brand-600">{Number(stats.anos)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Anos de atividade</p>
          </div>
          <div className="stat-card text-center py-4">
            <p className="text-2xl font-bold text-slate-700">{Number(stats.tipos)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Tipos de pronunciamento</p>
          </div>
          <div className="stat-card text-center py-4">
            <p className="text-sm font-bold text-slate-700">{fmt(stats.ultimo)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Último discurso</p>
          </div>
        </div>
      )}

      {/* Por ano */}
      {byYear.length > 0 && (
        <div className="stat-card space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Discursos por ano</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-1.5">
            {byYear.map((y) => {
              const pct = Math.round((y.total / maxYear) * 100);
              const active = ano === String(y.ano);
              return (
                <Link
                  key={y.ano}
                  href={buildHref({ ano: active ? undefined : String(y.ano) })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-center ${
                    active ? 'bg-brand-700 text-white' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="w-full h-8 flex items-end justify-center">
                    <div
                      className={`w-4 rounded-sm ${active ? 'bg-white/60' : 'bg-brand-200'}`}
                      style={{ height: `${Math.max(4, pct * 0.32)}px` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold">{y.ano}</span>
                  <span className={`text-[9px] ${active ? 'text-white/70' : 'text-slate-400'}`}>{y.total}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-2 items-center">
        {ano && <input type="hidden" name="ano" value={ano} />}
        <input
          name="search"
          defaultValue={search ?? ''}
          placeholder="Buscar por tema, palavras-chave…"
          className="input text-sm flex-1 min-w-48"
        />
        {byTipo.length > 0 && (
          <select name="tipo" defaultValue={tipo ?? ''} className="input text-sm w-auto">
            <option value="">Todos os tipos</option>
            {byTipo.map((t) => (
              <option key={t.tipo} value={t.tipo}>{t.tipo}</option>
            ))}
          </select>
        )}
        <button type="submit" className="btn-primary px-4">Filtrar</button>
        {(ano || tipo || search) && (
          <Link href="/discursos" className="btn border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm px-4">
            Limpar
          </Link>
        )}
      </form>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
        {listData.rows.length > 0 ? (
          <>
            {total > 0 && (
              <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-400">{total.toLocaleString('pt-BR')} discursos · página {page} de {totalPages}</span>
              </div>
            )}
            <ul className="divide-y divide-slate-50">
              {listData.rows.map((d) => (
                <li key={d.id} className="px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors group">
                  <div className="mt-0.5 p-1.5 rounded-lg border border-purple-100 bg-purple-50 flex-shrink-0">
                    <Mic className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {d.tipo && (
                        <span className="text-[11px] bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full font-medium">
                          {d.tipo}
                        </span>
                      )}
                      {d.fase && (
                        <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          {d.fase}
                        </span>
                      )}
                    </div>
                    {d.sumario ? (
                      <p className="text-sm text-slate-700 mt-1 line-clamp-3 leading-snug">{d.sumario}</p>
                    ) : (
                      <p className="text-sm text-slate-400 mt-1 italic">Sem sumário disponível</p>
                    )}
                    {d.keywords && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {d.keywords.split(',').slice(0, 5).map((kw) => kw.trim()).filter(Boolean).map((kw) => (
                          <span key={kw} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right space-y-1">
                    <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {fmt(d.data_hora_inicio)}
                    </p>
                    {fmtTime(d.data_hora_inicio) && (
                      <p className="text-[10px] text-slate-300">{fmtTime(d.data_hora_inicio)}</p>
                    )}
                    <div className="flex gap-1.5 justify-end sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
                      {d.url_texto && (
                        <a href={d.url_texto} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-0.5">
                          Texto <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {d.url_video && (
                        <a href={d.url_video} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-0.5">
                          Vídeo <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="py-16 text-center">
            <Mic className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nenhum discurso encontrado.</p>
            <p className="text-xs text-slate-300 mt-1">Rode a ingestão via <code className="bg-slate-100 px-1 rounded">POST /discursos/ingest/historical</code></p>
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Link
            href={hasPrev ? buildHref({ ano, tipo, search, page: page - 1 }) : '#'}
            aria-disabled={!hasPrev}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hasPrev ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' : 'opacity-40 pointer-events-none bg-white text-slate-400 border-slate-100'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Anterior
          </Link>
          <span className="text-xs text-slate-400">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} de {total.toLocaleString('pt-BR')}
          </span>
          <Link
            href={hasNext ? buildHref({ ano, tipo, search, page: page + 1 }) : '#'}
            aria-disabled={!hasNext}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hasNext ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' : 'opacity-40 pointer-events-none bg-white text-slate-400 border-slate-100'
            }`}
          >
            Próxima <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
