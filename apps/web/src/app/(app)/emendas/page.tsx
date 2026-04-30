import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Landmark, DollarSign, FileText, Scale, ExternalLink,
  Info, TrendingUp, AlertCircle, MapPin, BarChart3,
  Building2, CheckCircle2,
} from 'lucide-react';

export const revalidate = 3600;

interface PropositionListResponse {
  rows: Array<{
    id: number; type: string; number: number | null; year: number | null;
    title: string | null; status: string | null; presented_at: string | null; url: string | null;
  }>;
  total: number;
}

interface EmendasOrcStats {
  total: number;
  anos: number;
  estados: number;
  municipios: number;
  total_dotacao: string;
  total_empenhado: string;
  total_pago: string;
  individual: number;
  bancada: number;
}

interface EmendasOrcRow {
  id: number;
  ano: number;
  codigo_emenda: string | null;
  tipo_emenda: string | null;
  descricao: string | null;
  descricao_funcao: string | null;
  descricao_subfuncao: string | null;
  valor_dotacao: string | null;
  valor_empenhado: string | null;
  valor_pago: string | null;
  orgao_orcamentario: string | null;
  municipio: string | null;
  uf: string | null;
}

interface ByYear {
  ano: number;
  total: number;
  dotacao: string;
  empenhado: string;
  pago: string;
}

interface ByFuncao { funcao: string; total: number; pago: string }
interface ByUf     { uf: string;    total: number; pago: string }

function fmtBRL(v?: string | number | null, compact = false) {
  const n = Number(v ?? 0);
  if (!n) return '—';
  if (compact) {
    if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `R$ ${(n / 1_000).toFixed(0)}K`;
  }
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function execPct(pago?: string | null, dotacao?: string | null) {
  const p = Number(pago ?? 0);
  const d = Number(dotacao ?? 0);
  if (!d) return 0;
  return Math.min(100, Math.round((p / d) * 100));
}

export default async function EmendasPage({
  searchParams,
}: {
  searchParams: { ano?: string; uf?: string; search?: string };
}) {
  const qs = new URLSearchParams();
  if (searchParams.ano)    qs.set('ano', searchParams.ano);
  if (searchParams.uf)     qs.set('uf', searchParams.uf);
  if (searchParams.search) qs.set('search', searchParams.search);
  qs.set('limit', '60');

  const [orcList, orcStats, byYear, byFuncao, byUf, legData] = await Promise.all([
    api<{ rows: EmendasOrcRow[]; total: number }>(`/emendas-orc?${qs}`).catch(() => ({ rows: [], total: 0 })),
    api<EmendasOrcStats>('/emendas-orc/stats').catch(() => null),
    api<ByYear[]>('/emendas-orc/by-year').catch(() => [] as ByYear[]),
    api<ByFuncao[]>('/emendas-orc/by-funcao').catch(() => [] as ByFuncao[]),
    api<ByUf[]>('/emendas-orc/by-uf').catch(() => [] as ByUf[]),
    api<PropositionListResponse>('/propositions?type=PEC&limit=30').catch(() => ({ rows: [], total: 0 })),
  ]);

  const hasOrcData = (orcStats?.total ?? 0) > 0;
  const hasFilter = !!(searchParams.ano || searchParams.uf || searchParams.search);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="page-title">Emendas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Emendas orçamentárias e legislativas — execução, destinos e valores
        </p>
      </div>

      {/* ── Emendas Orçamentárias ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
            <DollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Emendas Parlamentares Orçamentárias</h2>
            <p className="text-xs text-slate-500">Fonte: Portal da Transparência — atualizado semanalmente</p>
          </div>
        </div>

        {!hasOrcData ? (
          <div className="stat-card py-10 text-center space-y-2">
            <DollarSign className="w-8 h-8 text-slate-200 mx-auto" />
            <p className="text-sm font-medium text-slate-500">Dados ainda não ingeridos</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Configure <code className="bg-slate-100 px-1 rounded">TRANSPARENCIA_API_KEY</code> e acione{' '}
              <code className="bg-slate-100 px-1 rounded">POST /admin/ingest-emendas-orc</code> no Swagger.
            </p>
            <a
              href="https://portaldatransparencia.gov.br/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-brand-700 hover:underline mt-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Obter chave gratuita
            </a>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="stat-card">
                <p className="section-label">Dotação total</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{fmtBRL(orcStats?.total_dotacao, true)}</p>
                <p className="text-xs text-slate-400 mt-1">{orcStats?.total} emendas</p>
              </div>
              <div className="stat-card">
                <p className="section-label">Valor pago</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{fmtBRL(orcStats?.total_pago, true)}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {execPct(orcStats?.total_pago, orcStats?.total_dotacao)}% executado
                </p>
              </div>
              <div className="stat-card">
                <p className="section-label">Municípios</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{orcStats?.municipios ?? 0}</p>
                <p className="text-xs text-slate-400 mt-1">{orcStats?.estados ?? 0} estados</p>
              </div>
              <div className="stat-card">
                <p className="section-label">Período</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{orcStats?.anos ?? 0} anos</p>
                <p className="text-xs text-slate-400 mt-1">
                  {orcStats?.individual ?? 0} individuais
                </p>
              </div>
            </div>

            {/* Execução por ano */}
            {byYear.length > 0 && (
              <div className="stat-card space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">Execução por ano</h3>
                </div>
                <div className="space-y-2.5">
                  {byYear.map((y) => {
                    const exec = execPct(y.pago, y.dotacao);
                    return (
                      <div key={y.ano} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-600 w-10 flex-shrink-0">{y.ano}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${exec}%` }}
                          />
                        </div>
                        <div className="text-right flex-shrink-0 w-32">
                          <span className="text-xs font-medium text-slate-700">{fmtBRL(y.pago, true)}</span>
                          <span className="text-xs text-slate-400 ml-1">/ {fmtBRL(y.dotacao, true)}</span>
                        </div>
                        <span className="text-xs text-slate-400 w-8 text-right">{exec}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Por área temática + por UF lado a lado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {byFuncao.length > 0 && (
                <div className="stat-card space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">Por área temática</h3>
                  <ul className="space-y-2">
                    {byFuncao.slice(0, 6).map((f) => (
                      <li key={f.funcao} className="flex items-center gap-2 text-xs">
                        <span className="flex-1 text-slate-600 truncate">{f.funcao}</span>
                        <span className="font-semibold text-slate-800 flex-shrink-0">{fmtBRL(f.pago, true)}</span>
                        <span className="text-slate-400 flex-shrink-0">({f.total})</span>
                      </li>
                    ))}
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
                    {byUf.slice(0, 6).map((u) => (
                      <li key={u.uf} className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-brand-700 w-6 flex-shrink-0">{u.uf}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${Math.min(100, (Number(u.pago) / Number(byUf[0].pago)) * 100)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-800 flex-shrink-0">{fmtBRL(u.pago, true)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Filtros + lista */}
            <div className="stat-card space-y-4">
              <form className="flex flex-wrap gap-3">
                <input
                  name="search"
                  defaultValue={searchParams.search ?? ''}
                  placeholder="Buscar por descrição, município…"
                  className="input flex-1 min-w-[180px] text-sm"
                />
                <input
                  name="ano"
                  defaultValue={searchParams.ano ?? ''}
                  placeholder="Ano"
                  className="input w-24 text-sm"
                />
                <input
                  name="uf"
                  defaultValue={searchParams.uf ?? ''}
                  placeholder="UF"
                  className="input w-16 text-sm uppercase"
                  maxLength={2}
                />
                <button type="submit" className="btn-primary text-sm py-2">Filtrar</button>
                {hasFilter && <Link href="/emendas" className="btn-secondary text-sm py-2">Limpar</Link>}
              </form>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{orcList.total} emendas</span>
              </div>

              {orcList.rows.length > 0 ? (
                <ul className="divide-y divide-slate-50 -mx-5">
                  {orcList.rows.map((e) => {
                    const exec = execPct(e.valor_pago, e.valor_dotacao);
                    return (
                      <li key={e.id} className="px-5 py-3.5">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <DollarSign className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="text-xs font-bold text-slate-800">{e.ano}</span>
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
                              {e.municipio && (
                                <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3" />{e.municipio}{e.uf ? `/${e.uf}` : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-700 leading-snug line-clamp-2">
                              {e.descricao ?? e.orgao_orcamentario ?? '—'}
                            </p>
                            {/* Barra de execução */}
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${exec}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-slate-500 flex-shrink-0 w-32 text-right">
                                {fmtBRL(e.valor_pago, true)}
                                <span className="text-slate-300 mx-0.5">/</span>
                                {fmtBRL(e.valor_dotacao, true)}
                                <span className="text-slate-400 ml-1">({exec}%)</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-400">Nenhuma emenda encontrada para o filtro.</p>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* ── Emendas Legislativas ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
            <Scale className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Emendas Legislativas</h2>
            <p className="text-xs text-slate-500">Emendas a PLs, PECs, substitutivos e destaques apresentados</p>
          </div>
        </div>

        {/* Tipos de emenda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Emenda Constitucional (PEC)', color: 'bg-purple-50 border-purple-200 text-purple-700', icon: Scale },
            { label: 'Emenda a Projeto de Lei',      color: 'bg-indigo-50 border-indigo-200 text-indigo-700', icon: FileText },
            { label: 'Substitutivo',                  color: 'bg-blue-50 border-blue-200 text-blue-700',     icon: FileText },
            { label: 'Destaque',                      color: 'bg-sky-50 border-sky-200 text-sky-700',        icon: CheckCircle2 },
          ].map(({ label, color, icon: Icon }) => (
            <div key={label} className={`rounded-xl border px-4 py-3 flex items-center gap-2 text-sm font-medium ${color}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* PECs apresentadas */}
        <div className="stat-card overflow-hidden !p-0">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              PECs apresentadas
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
                        <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                          {p.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-1 line-clamp-2 leading-snug">{p.title ?? '—'}</p>
                    {p.presented_at && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(p.presented_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Link href={`/propositions/${p.id}`}
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

      {/* Info */}
      <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-blue-800 text-xs">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
        <span>
          Dados orçamentários provenientes do{' '}
          <a href="https://portaldatransparencia.gov.br/emendas" target="_blank" rel="noopener noreferrer"
            className="underline font-medium">Portal da Transparência</a>.
          Atualizado semanalmente. Os valores de execução refletem o estágio empenho → liquidação → pagamento.
        </span>
      </div>
    </div>
  );
}
