import { api } from '@/lib/api';
import Link from 'next/link';
import {
  DollarSign, ExternalLink, Info, MapPin, BarChart3,
  ChevronLeft, ChevronRight, Filter, TrendingUp,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

interface EmendasOrcStats {
  total: number; anos: number; estados: number; municipios: number;
  total_dotacao: string; total_empenhado: string; total_pago: string;
  individual: number; bancada: number;
}

interface EmendasOrcRow {
  id: number; ano: number;
  codigo_emenda: string | null; tipo_emenda: string | null;
  descricao: string | null; descricao_funcao: string | null; descricao_subfuncao: string | null;
  valor_dotacao: string | null; valor_empenhado: string | null;
  valor_liquidado: string | null; valor_pago: string | null;
  orgao_orcamentario: string | null; municipio: string | null; uf: string | null;
  situacao: string | null;
}

interface ByYear   { ano: number; total: number; dotacao: string; empenhado: string; pago: string }
interface ByFuncao { funcao: string; total: number; pago: string }
interface ByUf     { uf: string;   total: number; pago: string }

function fmtBRL(v?: string | number | null, compact = false) {
  const n = Number(v ?? 0);
  if (!n) return '—';
  if (compact) {
    if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000)     return `R$ ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)         return `R$ ${(n / 1_000).toFixed(0)}K`;
  }
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function execPct(pago?: string | null, dotacao?: string | null) {
  const p = Number(pago ?? 0), d = Number(dotacao ?? 0);
  if (!d) return 0;
  return Math.min(100, Math.round((p / d) * 100));
}

function transparenciaUrl(codigoEmenda: string | null, ano: number) {
  if (!codigoEmenda) return null;
  return `https://portaldatransparencia.gov.br/emendas/consulta?paginacaoSimples=true&tamanhoPagina=10&offset=0&ordenarPor=localizador&direcaoOrdenacao=asc&codigoEmenda=${encodeURIComponent(codigoEmenda)}&ano=${ano}`;
}

export default async function EmendasPage({
  searchParams,
}: {
  searchParams: { ano?: string; uf?: string; search?: string; tipo?: string; page?: string };
}) {
  const parsedPage = Number(searchParams.page ?? 1);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const qs = new URLSearchParams();
  if (searchParams.ano)    qs.set('ano',    searchParams.ano);
  if (searchParams.uf)     qs.set('uf',     searchParams.uf.toUpperCase());
  if (searchParams.search) qs.set('search', searchParams.search);
  if (searchParams.tipo)   qs.set('tipo',   searchParams.tipo);
  qs.set('limit',  String(PAGE_SIZE));
  qs.set('offset', String(offset));

  const [orcList, orcStats, byYear, byFuncao, byUf] = await Promise.all([
    api<{ rows: EmendasOrcRow[]; total: number }>(`/emendas-orc?${qs}`).catch(() => ({ rows: [], total: 0 })),
    api<EmendasOrcStats>('/emendas-orc/stats').catch(() => null),
    api<ByYear[]>('/emendas-orc/by-year').catch(() => [] as ByYear[]),
    api<ByFuncao[]>('/emendas-orc/by-funcao').catch(() => [] as ByFuncao[]),
    api<ByUf[]>('/emendas-orc/by-uf').catch(() => [] as ByUf[]),
  ]);

  const hasOrcData = (orcStats?.total ?? 0) > 0;
  const hasFilter  = !!(searchParams.ano || searchParams.uf || searchParams.search || searchParams.tipo);
  const totalPages = orcList.total > 0 ? Math.ceil(orcList.total / PAGE_SIZE) : 0;

  function pageUrl(p: number) {
    const q = new URLSearchParams({ ...Object.fromEntries(qs), page: String(p) });
    q.delete('limit'); q.delete('offset');
    return `/emendas?${q}`;
  }

  const anos = byYear.map((y) => y.ano);
  const anoRange = anos.length > 1 ? `${Math.min(...anos)}–${Math.max(...anos)}` : anos[0] ? String(anos[0]) : '—';

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-title">Emendas Orçamentárias</h1>
          <p className="text-sm text-slate-500 mt-1">
            Emendas parlamentares — execução, destinos e valores
          </p>
        </div>
        {hasOrcData && (
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium self-start">
            {orcStats?.total} emendas totais
          </span>
        )}
      </div>

      {!hasOrcData ? (
        <div className="stat-card py-12 text-center space-y-3">
          <DollarSign className="w-10 h-10 text-slate-200 mx-auto" />
          <p className="text-sm font-medium text-slate-500">Dados ainda não ingeridos</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Configure <code className="bg-slate-100 px-1 rounded">TRANSPARENCIA_API_KEY</code> e acione{' '}
            <code className="bg-slate-100 px-1 rounded">POST /admin/ingest-emendas-orc</code> no Swagger.
          </p>
          <a href="https://portaldatransparencia.gov.br/api" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-brand-700 hover:underline">
            <ExternalLink className="w-3.5 h-3.5" /> Obter chave gratuita
          </a>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="stat-card">
              <p className="section-label">Dotação total</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{fmtBRL(orcStats?.total_dotacao, true)}</p>
              <p className="text-xs text-slate-400 mt-1">{orcStats?.total} emendas</p>
            </div>
            <div className="stat-card">
              <p className="section-label">Empenhado</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{fmtBRL(orcStats?.total_empenhado, true)}</p>
              <p className="text-xs text-slate-400 mt-1">
                {execPct(orcStats?.total_empenhado, orcStats?.total_dotacao)}% da dotação
              </p>
            </div>
            <div className="stat-card">
              <p className="section-label">Pago</p>
              <p className="text-xl font-bold text-green-600 mt-1">{fmtBRL(orcStats?.total_pago, true)}</p>
              <p className="text-xs text-slate-400 mt-1">
                {execPct(orcStats?.total_pago, orcStats?.total_dotacao)}% da dotação
              </p>
            </div>
            <div className="stat-card">
              <p className="section-label">Municípios</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{orcStats?.municipios ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">{orcStats?.estados ?? 0} estados</p>
            </div>
            <div className="stat-card col-span-2 sm:col-span-1">
              <p className="section-label">Período</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{anoRange}</p>
              <p className="text-xs text-slate-400 mt-1">
                {orcStats?.individual ?? 0} ind. · {orcStats?.bancada ?? 0} bancada
              </p>
            </div>
          </div>

          {/* Execução por ano */}
          {byYear.length > 0 && (
            <div className="stat-card space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Execução por ano</h3>
                <span className="text-xs text-slate-400">(dotação → empenhado → pago)</span>
              </div>
              <div className="space-y-3">
                {byYear.map((y) => {
                  const pctPago  = execPct(y.pago,     y.dotacao);
                  const pctEmp   = execPct(y.empenhado, y.dotacao);
                  return (
                    <div key={y.ano} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600 w-10 flex-shrink-0">{y.ano}</span>
                      <div className="flex-1 relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        {/* Empenhado (fundo) */}
                        <div className="absolute inset-y-0 left-0 bg-amber-200 rounded-full" style={{ width: `${pctEmp}%` }} />
                        {/* Pago (frente) */}
                        <div className="absolute inset-y-0 left-0 bg-green-500 rounded-full" style={{ width: `${pctPago}%` }} />
                      </div>
                      <div className="flex-shrink-0 text-right w-36">
                        <span className="text-xs font-medium text-green-700">{fmtBRL(y.pago, true)}</span>
                        <span className="text-xs text-slate-300 mx-0.5">/</span>
                        <span className="text-xs text-slate-500">{fmtBRL(y.dotacao, true)}</span>
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right flex-shrink-0">{pctPago}%</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 pt-1 border-t border-slate-50">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-3 h-2 rounded-full bg-amber-200 inline-block" /> Empenhado
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-3 h-2 rounded-full bg-green-500 inline-block" /> Pago
                </span>
              </div>
            </div>
          )}

          {/* Por área temática + por UF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {byFuncao.length > 0 && (
              <div className="stat-card space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">Por área temática</h3>
                </div>
                <ul className="space-y-2">
                  {byFuncao.slice(0, 8).map((f) => {
                    const pct = byFuncao[0]?.pago ? Math.round((Number(f.pago) / Number(byFuncao[0].pago)) * 100) : 0;
                    return (
                      <li key={f.funcao} className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex-1 text-slate-600 truncate">{f.funcao}</span>
                          <span className="font-semibold text-slate-800 flex-shrink-0">{fmtBRL(f.pago, true)}</span>
                          <span className="text-slate-400 flex-shrink-0 w-8 text-right">({f.total})</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {byUf.length > 0 && (
              <div className="stat-card space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">Por estado (destino)</h3>
                </div>
                <ul className="space-y-2">
                  {byUf.slice(0, 8).map((u) => {
                    const pct = byUf[0]?.pago ? Math.min(100, Math.round((Number(u.pago) / Number(byUf[0].pago)) * 100)) : 0;
                    return (
                      <li key={u.uf} className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-brand-700 w-7 flex-shrink-0">{u.uf}</span>
                          <span className="flex-1 text-slate-400 text-[11px]">{u.total} emendas</span>
                          <span className="font-semibold text-slate-800 flex-shrink-0">{fmtBRL(u.pago, true)}</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Filtros + lista */}
          <div className="space-y-4">
            <form className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input name="search" defaultValue={searchParams.search ?? ''}
                    placeholder="Buscar por descrição, município…"
                    className="input pl-9 text-xs w-full" />
                </div>
                <select name="tipo" defaultValue={searchParams.tipo ?? ''} className="input w-auto text-xs">
                  <option value="">Todos os tipos</option>
                  <option value="Individual">Individual</option>
                  <option value="Bancada">Bancada</option>
                  <option value="Comissão">Comissão</option>
                </select>
                <input name="ano" defaultValue={searchParams.ano ?? ''} placeholder="Ano"
                  className="input w-20 text-xs" type="number" min="2000" max="2099" />
                <input name="uf" defaultValue={searchParams.uf ?? ''} placeholder="UF"
                  className="input w-16 text-xs" maxLength={2} style={{ textTransform: 'uppercase' }} />
                <button type="submit" className="btn-primary text-xs py-2">Filtrar</button>
                {hasFilter && <Link href="/emendas" className="btn-secondary text-xs py-2">Limpar</Link>}
              </div>
            </form>

            <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
              {/* Cabeçalho da lista */}
              <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {orcList.total > 0
                    ? `${offset + 1}–${Math.min(offset + PAGE_SIZE, orcList.total)} de ${orcList.total} emendas`
                    : 'Nenhuma emenda encontrada'}
                </span>
                {hasFilter && (
                  <span className="text-[11px] text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full font-medium">
                    filtro ativo
                  </span>
                )}
              </div>

              {orcList.rows.length > 0 ? (
                <ul className="divide-y divide-slate-50">
                  {orcList.rows.map((e) => {
                    const exec = execPct(e.valor_pago, e.valor_dotacao);
                    const execEmp = execPct(e.valor_empenhado, e.valor_dotacao);
                    const portalHref = transparenciaUrl(e.codigo_emenda, e.ano);
                    return (
                      <li key={e.id} className="px-5 py-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <DollarSign className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                              <span className="text-xs font-bold text-slate-700">{e.ano}</span>
                              {e.tipo_emenda && (
                                <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">
                                  {e.tipo_emenda}
                                </span>
                              )}
                              {e.descricao_funcao && (
                                <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                                  {e.descricao_funcao}
                                </span>
                              )}
                              {e.situacao && (
                                <span className="text-[11px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full">
                                  {e.situacao}
                                </span>
                              )}
                              {e.municipio && (
                                <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3" />{e.municipio}{e.uf ? `/${e.uf}` : ''}
                                </span>
                              )}
                            </div>

                            {/* Descrição */}
                            <p className="text-sm text-slate-700 leading-snug line-clamp-2">
                              {e.descricao ?? e.orgao_orcamentario ?? '—'}
                            </p>
                            {e.descricao_subfuncao && (
                              <p className="text-xs text-slate-400 mt-0.5">{e.descricao_subfuncao}</p>
                            )}

                            {/* Barras de execução */}
                            <div className="mt-2.5 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 w-16 flex-shrink-0">Empenhado</span>
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${execEmp}%` }} />
                                </div>
                                <span className="text-[11px] text-amber-600 font-medium flex-shrink-0 w-20 text-right">
                                  {fmtBRL(e.valor_empenhado, true)} <span className="text-slate-300">({execEmp}%)</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 w-16 flex-shrink-0">Pago</span>
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${exec}%` }} />
                                </div>
                                <span className="text-[11px] text-green-700 font-medium flex-shrink-0 w-20 text-right">
                                  {fmtBRL(e.valor_pago, true)} <span className="text-slate-300">({exec}%)</span>
                                </span>
                              </div>
                            </div>

                            {/* Código + dotação */}
                            <div className="flex items-center gap-3 mt-1.5">
                              {e.codigo_emenda && (
                                <span className="text-[10px] text-slate-400 font-mono">{e.codigo_emenda}</span>
                              )}
                              <span className="text-[11px] text-slate-400">
                                dotação: <span className="font-medium text-slate-600">{fmtBRL(e.valor_dotacao, true)}</span>
                              </span>
                            </div>
                          </div>

                          {/* Link para Portal */}
                          {portalHref && (
                            <a href={portalHref} target="_blank" rel="noopener noreferrer"
                              title="Ver no Portal da Transparência"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex-shrink-0 mt-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-12 text-center">
                  <DollarSign className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">
                    {hasFilter ? 'Nenhuma emenda encontrada para o filtro.' : 'Nenhuma emenda encontrada.'}
                  </p>
                </div>
              )}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Página {page} de {totalPages}
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
                    if (totalPages <= 7)          p = i + 1;
                    else if (page <= 4)           p = i + 1;
                    else if (page >= totalPages - 3) p = totalPages - 6 + i;
                    else                          p = page - 3 + i;
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
        </>
      )}

      {/* Info */}
      <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-blue-800 text-xs">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
        <span>
          Dados provenientes do{' '}
          <a href="https://portaldatransparencia.gov.br/emendas" target="_blank" rel="noopener noreferrer"
            className="underline font-medium">Portal da Transparência</a>.{' '}
          Atualizado semanalmente. Os valores refletem o estágio dotação → empenhado → pago.
        </span>
      </div>
    </div>
  );
}
