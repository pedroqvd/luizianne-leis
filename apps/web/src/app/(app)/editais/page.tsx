import { api } from '@/lib/api';
import { requireTabAccess } from '@/lib/auth-guard';
import { EditaisToolbarClient } from './EditaisToolbarClient';
import { MinisteriosPanelClient, type MinistrySummary } from './MinisteriosPanelClient';
import Link from 'next/link';
import {
  FileText,
  ExternalLink,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle,
  PauseCircle,
  Clock,
  DollarSign,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Handshake,
  Tag,
  MapPin,
  Landmark,
  ListFilter,
  X,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Edital {
  id: number;
  pncp_id: string | null;
  titulo: string;
  orgao: string;
  ministerio: string;
  ministerio_slug?: string | null;
  ministerio_sigla?: string | null;
  autarquia?: string | null;
  orgao_superior?: string | null;
  numero: string | null;
  objeto: string | null;
  modalidade: string | null;
  valor_estimado: number | null;
  data_abertura: string | null;
  data_encerramento: string | null;
  data_proposta_inicio: string | null;
  data_proposta_fim: string | null;
  data_publicacao: string | null;
  situacao: string;
  url_fonte: string | null;
  url_edital: string | null;
  uf: string | null;
  municipio?: string | null;
  unidade_nome: string | null;
  categoria_tematica?: string | null;
  keywords_extraidas?: string[] | null;
  publico_alvo?: string[] | null;
  elegivel_prefeituras?: boolean | null;
  abrangencia?: string | null;
  modo_disputa?: string | null;
  origem?: string | null;
  matched_authorities_count?: number;
  max_match_score?: number;
  matched_municipalities?: string[];
}

interface EditalStats {
  abertos: number;
  encerrados: number;
  suspensos: number;
  revogados: number;
  encerrando_7d: number;
  encerrando_30d: number;
  elegiveis_prefeituras?: number;
  com_match_prefeitos?: number;
  valor_total_abertos: string;
  ministerios_ativos: number;
  total: number;
}

interface ListResponse {
  rows: Edital[];
  total: number;
}

const SITUACAO: Record<string, { label: string; badge: string; icon: any }> = {
  aberto:    { label: 'Aberto',    badge: 'text-green-700 bg-green-50 border-green-200',  icon: CheckCircle },
  encerrado: { label: 'Encerrado', badge: 'text-slate-600 bg-slate-100 border-slate-200', icon: CheckCircle },
  suspenso:  { label: 'Suspenso',  badge: 'text-amber-700 bg-amber-50 border-amber-200',  icon: PauseCircle },
  revogado:  { label: 'Revogado',  badge: 'text-red-700 bg-red-50 border-red-200',        icon: AlertCircle },
};

const THEMATIC_CATEGORIES = [
  'saúde',
  'educação',
  'infraestrutura',
  'recursos hídricos',
  'agricultura',
  'assistência social',
  'habitação',
  'cultura e esporte',
  'meio ambiente',
  'segurança pública',
  'desenvolvimento regional',
];

function fmt(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtBRL(v?: number | string | null) {
  if (!v) return null;
  const n = Number(v);
  if (isNaN(n) || n === 0) return null;
  if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}K`;
  return `R$ ${n.toFixed(0)}`;
}

function daysUntil(d?: string | null): number | null {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

function EncerrandoBadge({ dataFim, situacao }: { dataFim?: string | null; situacao: string }) {
  if (situacao !== 'aberto') return null;
  const days = daysUntil(dataFim);
  if (days === null || days < 0) return null;
  if (days <= 3) {
    return (
      <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full animate-pulse">
        Encerra em {days}d
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        Encerra em {days}d
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        Encerra em {days}d
      </span>
    );
  }
  return null;
}

export default async function EditaisPage({
  searchParams,
}: {
  searchParams: {
    view?: string;
    situacao?: string;
    ministerio?: string;
    ministerioSlug?: string;
    ministerioSigla?: string;
    autarquia?: string;
    modalidade?: string;
    uf?: string;
    categoria?: string;
    elegivelPrefeituras?: string;
    comMatchPrefeitos?: string;
    search?: string;
    encerrandoEm?: string;
    page?: string;
  };
}) {
  await requireTabAccess('editais');

  const PAGE_SIZE = 50;
  const parsedPage = Number(searchParams.page ?? 1);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v && k !== 'page' && k !== 'view') qs.set(k, v);
  }
  qs.set('limit', String(PAGE_SIZE));
  qs.set('offset', String(offset));

  const [listData, stats, ministries, byMinisterioData] = await Promise.all([
    api<ListResponse>(`/editais?${qs}`).catch(() => ({ rows: [], total: 0 })),
    api<EditalStats>('/editais/stats').catch(() => null),
    api<string[]>('/editais/ministries').catch(() => [] as string[]),
    api<MinistrySummary[]>('/editais/by-ministerio').catch(() => [] as MinistrySummary[]),
  ]);

  const hasSpecificFilter = Boolean(
    searchParams.search ||
    searchParams.categoria ||
    searchParams.ministerioSlug ||
    searchParams.ministerio ||
    searchParams.autarquia ||
    searchParams.situacao ||
    searchParams.uf ||
    searchParams.elegivelPrefeituras ||
    searchParams.comMatchPrefeitos ||
    searchParams.encerrandoEm ||
    searchParams.page,
  );

  // View ativa: se o usuário especificou 'lista' ou tem filtros ativos, mostra lista; caso contrário, mostra o painel dos ministérios
  const activeView: 'ministerios' | 'lista' =
    searchParams.view === 'lista' || (hasSpecificFilter && searchParams.view !== 'ministerios')
      ? 'lista'
      : 'ministerios';

  const totalPages = listData.total > 0 ? Math.ceil(listData.total / PAGE_SIZE) : 0;

  function pageUrl(p: number) {
    const q = new URLSearchParams({ ...Object.fromEntries(qs), view: 'lista', page: String(p) });
    q.delete('limit');
    q.delete('offset');
    return `/editais?${q}`;
  }

  // Encontra o ministério selecionado se houver
  const selectedMin = byMinisterioData.find(
    (m) => m.slug === searchParams.ministerioSlug,
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="page-title">Radar de Editais & Captação Federal</h1>
          <p className="text-sm text-slate-500 mt-1">
            Mapeamento contínuo dos 30+ Ministérios e Autarquias Federais com cruzamento estratégico
            para municípios do Ceará.
          </p>
        </div>

        <EditaisToolbarClient />
      </div>

      {/* KPI Stats */}
      {stats && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            href="/editais?view=lista&situacao=aberto"
            className="stat-card hover:shadow-md transition-shadow border-green-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label">Abertos Hoje</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.abertos}</p>
                <p className="text-xs text-slate-400 mt-1">oportunidades ativas</p>
              </div>
              <div className="p-2 bg-green-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Link>

          <Link
            href="/editais?view=lista&comMatchPrefeitos=true&situacao=aberto"
            className="stat-card hover:shadow-md transition-shadow border-purple-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label text-purple-700">Match c/ Prefeitos</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {stats.com_match_prefeitos ?? 0}
                </p>
                <p className="text-xs text-purple-500 mt-1">demandas cruzadas</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-xl">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </Link>

          <Link
            href="/editais?view=lista&elegivelPrefeituras=true&situacao=aberto"
            className="stat-card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label">Elegíveis Municípios</p>
                <p className="text-2xl font-bold text-brand-700 mt-1">
                  {stats.elegiveis_prefeituras ?? stats.abertos}
                </p>
                <p className="text-xs text-slate-400 mt-1">prefeituras / adesão SRP</p>
              </div>
              <div className="p-2 bg-brand-50 rounded-xl">
                <Handshake className="w-5 h-5 text-brand-700" />
              </div>
            </div>
          </Link>

          <Link
            href="/editais?view=lista&encerrandoEm=7&situacao=aberto"
            className="stat-card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label">Encerrando em 7d</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.encerrando_7d}</p>
                <p className="text-xs text-slate-400 mt-1">{stats.encerrando_30d} em 30 dias</p>
              </div>
              <div className="p-2 bg-red-50 rounded-xl">
                <Clock className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </Link>

          <Link
            href="/editais?view=ministerios"
            className="stat-card hover:shadow-md transition-shadow border-emerald-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label">Volume Aberto</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {fmtBRL(stats.valor_total_abertos) ?? '—'}
                </p>
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  {stats.ministerios_ativos} ministérios ativos
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Main Navigation Tabs: Ministérios & Autarquias vs Radar Geral */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <Link
          href="/editais?view=ministerios"
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeView === 'ministerios'
              ? 'bg-brand-700 text-white shadow-sm ring-2 ring-brand-700/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Landmark className="w-4 h-4" />
          Painel por Ministérios & Autarquias (30+)
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              activeView === 'ministerios' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {stats?.ministerios_ativos ?? 0} ativos hoje
          </span>
        </Link>

        <Link
          href="/editais?view=lista"
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeView === 'lista'
              ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          Radar Geral de Editais
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeView === 'lista' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {listData.total}
          </span>
        </Link>
      </div>

      {/* VIEW 1: PAINEL POR MINISTÉRIOS & AUTARQUIAS */}
      {activeView === 'ministerios' && (
        <MinisteriosPanelClient ministries={byMinisterioData} />
      )}

      {/* VIEW 2: RADAR GERAL DE EDITAIS */}
      {activeView === 'lista' && (
        <div className="space-y-6">
          {/* Active Filter Pills Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/editais?view=lista"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                !hasSpecificFilter
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todos os Editais
            </Link>

            {/* Selected Ministry Pill */}
            {searchParams.ministerioSlug && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white">
                🏛️ Ministério: {selectedMin ? `${selectedMin.sigla} (${selectedMin.nome})` : searchParams.ministerioSlug}
                <Link
                  href={`/editais?${new URLSearchParams({
                    ...Object.fromEntries(qs),
                    view: 'lista',
                    ministerioSlug: '',
                  })}`}
                  className="hover:text-red-300 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </Link>
              </span>
            )}

            {/* Selected Autarchy Pill */}
            {searchParams.autarquia && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-700 text-white">
                🏢 Autarquia: {searchParams.autarquia}
                <Link
                  href={`/editais?${new URLSearchParams({
                    ...Object.fromEntries(qs),
                    view: 'lista',
                    autarquia: '',
                  })}`}
                  className="hover:text-red-300 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </Link>
              </span>
            )}

            <Link
              href="/editais?view=lista&comMatchPrefeitos=true&situacao=aberto"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                searchParams.comMatchPrefeitos === 'true'
                  ? 'bg-purple-700 text-white border-purple-700'
                  : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Recomendados p/ Prefeitos (Match)
            </Link>

            <Link
              href="/editais?view=lista&elegivelPrefeituras=true&situacao=aberto"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                searchParams.elegivelPrefeituras === 'true'
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              🏛️ Elegíveis p/ Prefeituras
            </Link>

            <Link
              href="/editais?view=lista&uf=CE&situacao=aberto"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                searchParams.uf === 'CE'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              📍 Sediados no Ceará (CE)
            </Link>

            {['saúde', 'infraestrutura', 'educação', 'recursos hídricos', 'agricultura'].map((cat) => (
              <Link
                key={cat}
                href={`/editais?view=lista&categoria=${encodeURIComponent(cat)}&situacao=aberto`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
                  searchParams.categoria === cat
                    ? 'bg-brand-700 text-white border-brand-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>

          {/* Advanced Filters Form */}
          <div className="stat-card">
            <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <input type="hidden" name="view" value="lista" />

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Busca Semântica (FTS Português)
                </label>
                <input
                  name="search"
                  defaultValue={searchParams.search ?? ''}
                  placeholder="Ex: pavimentação, ambulância, UBS, creche, adutora…"
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Ministério Federal
                </label>
                <select
                  name="ministerioSlug"
                  defaultValue={searchParams.ministerioSlug ?? ''}
                  className="input text-xs font-medium"
                >
                  <option value="">Todos os 30+ Ministérios</option>
                  {byMinisterioData.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.sigla} — {m.nome.length > 30 ? m.nome.slice(0, 30) + '…' : m.nome}{' '}
                      {m.editais_abertos > 0 ? `(${m.editais_abertos} abertos)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Autarquia / Fundação
                </label>
                <input
                  name="autarquia"
                  defaultValue={searchParams.autarquia ?? ''}
                  placeholder="Ex: FNDE, DNOCS, FIOCRUZ…"
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Área Temática</label>
                <select
                  name="categoria"
                  defaultValue={searchParams.categoria ?? ''}
                  className="input text-xs"
                >
                  <option value="">Todas as áreas</option>
                  {THEMATIC_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Situação</label>
                <select
                  name="situacao"
                  defaultValue={searchParams.situacao ?? ''}
                  className="input text-xs"
                >
                  <option value="">Todas</option>
                  <option value="aberto">Abertos</option>
                  <option value="encerrado">Encerrados</option>
                  <option value="suspenso">Suspensos</option>
                  <option value="revogado">Revogados</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-6 flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="elegivelPrefeituras"
                      value="true"
                      defaultChecked={searchParams.elegivelPrefeituras === 'true'}
                      className="rounded border-slate-300 text-brand-700"
                    />
                    Apenas Elegíveis para Prefeituras
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="comMatchPrefeitos"
                      value="true"
                      defaultChecked={searchParams.comMatchPrefeitos === 'true'}
                      className="rounded border-slate-300 text-purple-700"
                    />
                    Apenas com Match nas Demandas dos Prefeitos
                  </label>
                </div>

                <div className="flex gap-2">
                  {hasSpecificFilter && (
                    <Link href="/editais?view=lista" className="btn-secondary text-xs py-2">
                      Limpar Filtros
                    </Link>
                  )}
                  <button type="submit" className="btn-primary text-xs py-2">
                    <Filter className="w-3.5 h-3.5" /> Aplicar Filtros
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Results List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {listData.total > 0
                  ? `Mostrando ${offset + 1}–${Math.min(offset + PAGE_SIZE, listData.total)} de ${listData.total} editais`
                  : 'Nenhum edital encontrado'}
              </span>
              {hasSpecificFilter && (
                <span className="text-[11px] text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-0.5 rounded-full font-medium">
                  Filtro ativo
                </span>
              )}
            </div>

            {listData.rows.length === 0 ? (
              <div className="stat-card py-16 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-600 font-semibold">
                  Nenhum edital encontrado para os filtros selecionados.
                </p>
                <p className="text-xs text-slate-400">
                  Tente limpar os filtros ou selecionar outro ministério federal no painel acima.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {listData.rows.map((edital) => {
                  const s = SITUACAO[edital.situacao] ?? SITUACAO.encerrado;
                  const Icon = s.icon;
                  const valor = fmtBRL(edital.valor_estimado);
                  const encerraDias = daysUntil(edital.data_proposta_fim);
                  const matchCount = Number(edital.matched_authorities_count ?? 0);
                  const matchedMuns = edital.matched_municipalities ?? [];

                  return (
                    <div
                      key={edital.id}
                      className={`stat-card hover:shadow-md transition-all ${
                        matchCount > 0 ? 'border-l-4 border-l-purple-600' : ''
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Badges row */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${s.badge}`}
                            >
                              <Icon className="w-3 h-3" /> {s.label}
                            </span>
                            <EncerrandoBadge
                              dataFim={edital.data_proposta_fim}
                              situacao={edital.situacao}
                            />

                            {/* Canonical Ministry Sigla Badge */}
                            {edital.ministerio_sigla && (
                              <Link
                                href={`/editais?view=lista&ministerioSlug=${encodeURIComponent(
                                  edital.ministerio_slug || '',
                                )}&situacao=aberto`}
                                className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-slate-900 text-white px-2 py-0.5 rounded-md hover:bg-slate-800 transition-colors"
                                title={edital.ministerio}
                              >
                                <Landmark className="w-3 h-3" />
                                {edital.ministerio_sigla}
                              </Link>
                            )}

                            {/* Autarchy Badge */}
                            {edital.autarquia && (
                              <Link
                                href={`/editais?view=lista&autarquia=${encodeURIComponent(
                                  edital.autarquia,
                                )}&situacao=aberto`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md hover:bg-emerald-200 transition-colors"
                                title={`Autarquia/Fundação Vinculada: ${edital.autarquia}`}
                              >
                                <Building2 className="w-3 h-3 text-emerald-700" />
                                {edital.autarquia.length > 32
                                  ? edital.autarquia.slice(0, 32) + '…'
                                  : edital.autarquia}
                              </Link>
                            )}

                            {edital.categoria_tematica && (
                              <span className="text-[11px] bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded-full font-semibold capitalize flex items-center gap-1">
                                <Tag className="w-3 h-3" /> {edital.categoria_tematica}
                              </span>
                            )}
                            {edital.elegivel_prefeituras && (
                              <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                                🏛️ Elegível Prefeituras
                              </span>
                            )}
                            {edital.modalidade && (
                              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                {edital.modalidade}
                              </span>
                            )}
                            {valor && (
                              <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                                {valor}
                              </span>
                            )}
                            {matchCount > 0 && (
                              <Link
                                href={`/editais/${edital.id}#traqueamento`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-600 text-white px-2.5 py-0.5 rounded-full hover:bg-purple-700 transition-colors"
                              >
                                <Sparkles className="w-3 h-3" />
                                Match c/ {matchCount} Prefeitura(s)
                                {matchedMuns.length > 0 ? `: ${matchedMuns.slice(0, 3).join(', ')}` : ''}
                              </Link>
                            )}
                          </div>

                          {/* Clickable Title */}
                          <Link
                            href={`/editais/${edital.id}`}
                            className="text-base font-bold text-slate-900 hover:text-brand-700 transition-colors block leading-snug"
                          >
                            {edital.titulo}
                          </Link>

                          {/* Organ & Location */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <strong className="text-slate-700">
                                {edital.ministerio || edital.orgao}
                              </strong>
                            </span>
                            {edital.autarquia && (
                              <span className="text-emerald-700 font-semibold">
                                · {edital.autarquia}
                              </span>
                            )}
                            {edital.unidade_nome &&
                              edital.unidade_nome !== edital.ministerio &&
                              edital.unidade_nome !== edital.autarquia && (
                                <span className="text-slate-400">· {edital.unidade_nome}</span>
                              )}
                            {edital.uf && (
                              <span className="flex items-center gap-0.5 text-slate-500">
                                <MapPin className="w-3 h-3" />
                                {edital.municipio ? `${edital.municipio}/${edital.uf}` : edital.uf}
                              </span>
                            )}
                            {edital.numero && <span className="text-slate-400">Nº {edital.numero}</span>}
                          </div>

                          {/* Objeto */}
                          {edital.objeto && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {edital.objeto}
                            </p>
                          )}

                          {/* Dates & Keywords */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-0.5">
                            {edital.data_publicacao && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Publicado: <strong className="text-slate-600">{fmt(edital.data_publicacao)}</strong>
                              </span>
                            )}
                            {edital.data_proposta_fim && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Encerra:{' '}
                                <strong
                                  className={
                                    encerraDias !== null && encerraDias <= 7
                                      ? 'text-red-600 font-bold'
                                      : 'text-slate-600'
                                  }
                                >
                                  {fmt(edital.data_proposta_fim)}
                                </strong>
                              </span>
                            )}
                            {(edital.keywords_extraidas?.length ?? 0) > 0 && (
                              <span className="text-slate-400 hidden md:inline">
                                Tags: {edital.keywords_extraidas?.slice(0, 4).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions column */}
                        <div className="flex lg:flex-col items-center gap-2 self-end lg:self-center shrink-0">
                          <Link href={`/editais/${edital.id}`} className="btn-primary text-xs py-2 px-3">
                            Ver Detalhes
                          </Link>
                          {edital.url_fonte && (
                            <a
                              href={edital.url_fonte}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                              title="Abrir no PNCP oficial"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> PNCP
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  Página {page} de {totalPages} ({listData.total} editais)
                </span>
                <div className="flex items-center gap-2">
                  {page > 1 ? (
                    <Link href={pageUrl(page - 1)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </Link>
                  ) : (
                    <span className="btn-secondary text-xs py-1.5 px-3 opacity-40 cursor-not-allowed flex items-center gap-1">
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </span>
                  )}

                  {page < totalPages ? (
                    <Link href={pageUrl(page + 1)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                      Próxima <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span className="btn-secondary text-xs py-1.5 px-3 opacity-40 cursor-not-allowed flex items-center gap-1">
                      Próxima <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
