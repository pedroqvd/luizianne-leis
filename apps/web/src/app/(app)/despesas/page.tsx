import { api } from '@/lib/api';
import Link from 'next/link';
import { Receipt, TrendingDown, ChevronLeft, ChevronRight, ExternalLink, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 60;

interface DespesaRow {
  id: number;
  ano: number;
  mes: number;
  tipo_despesa: string | null;
  data_documento: string | null;
  valor_bruto: number;
  valor_glosa: number;
  valor_liquido: number;
  fornecedor: string | null;
  nome_fornecedor: string | null;
  cnpj_cpf: string | null;
  url_documento: string | null;
}

interface DespesaStats {
  total: string;
  anos: string;
  tipos: string;
  fornecedores: string;
  total_liquido: string;
  total_bruto: string;
  total_glosa: string;
  ano_inicio: string;
  ano_fim: string;
}

interface ByYear { ano: number; total: number; liquido: string; bruto: string }
interface ByTipo { tipo_despesa: string; total: number; liquido: string }

const MESES = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function fmtBRL(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildHref(params: { ano?: string; tipo?: string; search?: string; page?: number }) {
  const p = new URLSearchParams();
  if (params.ano) p.set('ano', params.ano);
  if (params.tipo) p.set('tipo', params.tipo);
  if (params.search) p.set('search', params.search);
  if (params.page && params.page > 1) p.set('page', String(params.page));
  const qs = p.toString();
  return `/despesas${qs ? `?${qs}` : ''}`;
}

export default async function DespesasPage({
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
    api<{ rows: DespesaRow[]; total: number }>(`/ceap?${qs}`).catch(() => ({ rows: [], total: 0 })),
    api<DespesaStats>('/ceap/stats').catch(() => null),
    api<ByYear[]>('/ceap/by-year').catch(() => [] as ByYear[]),
    api<ByTipo[]>('/ceap/by-tipo').catch(() => [] as ByTipo[]),
  ]);

  const total = listData.total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const maxLiquido = byTipo.length > 0 ? Number(byTipo[0]?.liquido ?? 1) || 1 : 1;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="page-title">CEAP — Cota Parlamentar</h1>
        <p className="text-sm text-slate-500 mt-1">
          Despesas reembolsadas pela Cota para o Exercício da Atividade Parlamentar
        </p>
      </div>

      {/* Stats */}
      {stats && Number(stats.total) > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card text-center py-4">
            <p className="text-2xl font-bold text-slate-700">{Number(stats.total).toLocaleString('pt-BR')}</p>
            <p className="text-xs text-slate-400 mt-0.5">Despesas registradas</p>
            <p className="text-[10px] text-slate-300 mt-0.5">{stats.ano_inicio}–{stats.ano_fim}</p>
          </div>
          <div className="stat-card text-center py-4">
            <p className="text-2xl font-bold text-brand-600">{fmtBRL(stats.total_liquido)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total reembolsado</p>
            <p className="text-[10px] text-slate-300 mt-0.5">valor líquido</p>
          </div>
          <div className="stat-card text-center py-4">
            <p className="text-2xl font-bold text-slate-700">{Number(stats.tipos)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Tipos de despesa</p>
          </div>
          <div className="stat-card text-center py-4">
            <p className="text-2xl font-bold text-slate-700">{Number(stats.fornecedores).toLocaleString('pt-BR')}</p>
            <p className="text-xs text-slate-400 mt-0.5">Fornecedores</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por tipo */}
        {byTipo.length > 0 && (
          <div className="stat-card space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-slate-400" /> Por categoria
            </h3>
            <ul className="space-y-2">
              {byTipo.slice(0, 12).map((t) => {
                const pct = Math.round((Number(t.liquido) / maxLiquido) * 100);
                return (
                  <li key={t.tipo_despesa} className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex-1 text-slate-600 truncate capitalize">
                        {t.tipo_despesa.toLowerCase()}
                      </span>
                      <span className="font-semibold text-slate-800 flex-shrink-0">{fmtBRL(t.liquido)}</span>
                      <span className="text-slate-400 flex-shrink-0 w-7 text-right">({t.total})</span>
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

        {/* Por ano */}
        {byYear.length > 0 && (
          <div className="stat-card space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Por ano</h3>
            <ul className="space-y-1.5">
              {byYear.slice(0, 12).map((y) => {
                const maxY = Number(byYear[0]?.liquido ?? 1) || 1;
                const pct = Math.round((Number(y.liquido) / maxY) * 100);
                return (
                  <li key={y.ano}>
                    <Link
                      href={buildHref({ ano: String(y.ano) })}
                      className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1 transition-colors ${
                        ano === String(y.ano) ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="font-semibold w-10 flex-shrink-0">{y.ano}</span>
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-semibold text-slate-800 flex-shrink-0">{fmtBRL(y.liquido)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-2 items-center">
        <input type="hidden" name="ano" value={ano ?? ''} />
        <input
          name="search"
          defaultValue={search ?? ''}
          placeholder="Buscar fornecedor / CNPJ…"
          className="input text-sm flex-1 min-w-40"
        />
        <select name="tipo" defaultValue={tipo ?? ''} className="input text-sm">
          <option value="">Todos os tipos</option>
          {byTipo.map((t) => (
            <option key={t.tipo_despesa} value={t.tipo_despesa}>
              {t.tipo_despesa.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary px-4">Filtrar</button>
        {(ano || tipo || search) && (
          <Link href="/despesas" className="btn border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm px-4">
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
                <span className="text-xs text-slate-400">{total.toLocaleString('pt-BR')} despesas · página {page} de {totalPages}</span>
              </div>
            )}
            <ul className="divide-y divide-slate-50">
              {listData.rows.map((d) => (
                <li key={d.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors group">
                  <div className="mt-0.5 p-1.5 rounded-lg border border-slate-200 bg-slate-50 flex-shrink-0">
                    <Receipt className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {d.tipo_despesa && (
                        <span className="text-[11px] bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded-full font-medium capitalize">
                          {d.tipo_despesa.toLowerCase()}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {MESES[d.mes] ?? d.mes}/{d.ano}
                      </span>
                      {Number(d.valor_glosa) > 0 && (
                        <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">
                          Glosa: {fmtBRL(d.valor_glosa)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-0.5 font-medium truncate">
                      {d.nome_fornecedor ?? d.fornecedor ?? '—'}
                    </p>
                    {d.cnpj_cpf && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />{d.cnpj_cpf}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-800">{fmtBRL(d.valor_liquido)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(d.data_documento)}</p>
                    {d.url_documento && (
                      <a
                        href={d.url_documento}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-brand-600 hover:text-brand-700 font-medium mt-1 inline-flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
                      >
                        Nota <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="py-16 text-center">
            <Receipt className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nenhuma despesa encontrada.</p>
            <p className="text-xs text-slate-300 mt-1">Rode a ingestão via <code className="bg-slate-100 px-1 rounded">POST /ceap/ingest/historical</code></p>
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
