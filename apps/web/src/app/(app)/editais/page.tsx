import { api } from '@/lib/api';
import { requireTabAccess } from '@/lib/auth-guard';
import { EditaisToolbarClient } from './EditaisToolbarClient';
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
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Edital {
  id: number;
  pncp_id: string | null;
  titulo: string;
  orgao: string;
  ministerio: string;
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
    situacao?: string;
    ministerio?: string;
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
    if (v && k !== 'page') qs.set(k, v);
  }
  qs.set('limit', String(PAGE_SIZE));
  qs.set('offset', String(offset));

  const [listData, stats, ministries] = await Promise.all([
    api<ListResponse>(`/editais?${qs}`).catch(() => ({ rows: [], total: 0 })),
    api<EditalStats>('/editais/stats').catch(() => null),
    api<string[]>('/editais/ministries').catch(() => [] as string[]),
  ]);

  const hasFilter = Object.keys(searchParams).filter((k) => k !== 'page' && searchParams[k as keyof typeof searchParams]).length > 0;
  const totalPages = listData.total > 0 ? Math.ceil(listData.total / PAGE_SIZE) : 0;

  function pageUrl(p: number) {
    const q = new URLSearchParams({ ...Object.fromEntries(qs), page: String(p) });
    q.delete('limit');
    q.delete('offset');
    return `/editais?${q}`;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="page-title">Radar Profundo de Editais & Seleções Federais</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitoramento em tempo real (PNCP, Transferegov & Novo PAC) com classificação temática e
            cruzamento automático com as demandas dos prefeitos do Ceará.
          </p>
        </div>

        <EditaisToolbarClient />
      </div>

      {/* KPI Stats */}
      {stats && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label">Abertos</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.abertos}</p>
                <p className="text-xs text-slate-400 mt-1">oportunidades ativas</p>
              </div>
              <div className="p-2 bg-green-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <Link
            href="/editais?comMatchPrefeitos=true&situacao=aberto"
            className="stat-card hover:shadow-md transition-shadow border-purple-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label text-purple-700">Match c/ Prefeitos</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {stats.com_match_prefeitos ?? 0}
                </p>
                <p className="text-xs text-purple-500 mt-1">compatíveis c/ demandas</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-xl">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </Link>

          <Link
            href="/editais?elegivelPrefeituras=true&situacao=aberto"
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
            href="/editais?encerrandoEm=7&situacao=aberto"
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

          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label">Volume Aberto</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {fmtBRL(stats.valor_total_abertos) ?? '—'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {stats.ministerios_ativos} órgãos ativos
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/editais"
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            !hasFilter
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos os Editais
        </Link>
        <Link
          href="/editais?comMatchPrefeitos=true&situacao=aberto"
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
            searchParams.comMatchPrefeitos === 'true'
              ? 'bg-purple-700 text-white border-purple-700'
              : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Recomendados p/ Prefeitos (Match)
        </Link>
        <Link
          href="/editais?elegivelPrefeituras=true&situacao=aberto"
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            searchParams.elegivelPrefeituras === 'true'
              ? 'bg-brand-700 text-white border-brand-700'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          🏛️ Elegíveis p/ Prefeituras
        </Link>
        <Link
          href="/editais?uf=CE&situacao=aberto"
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
            href={`/editais?categoria=${encodeURIComponent(cat)}&situacao=aberto`}
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
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Ministério / Órgão
            </label>
            <select
              name="ministerio"
              defaultValue={searchParams.ministerio ?? ''}
              className="input text-xs"
            >
              <option value="">Todos os órgãos</option>
              {ministries.map((m) => (
                <option key={m} value={m}>
                  {m.length > 45 ? m.slice(0, 45) + '…' : m}
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

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Prazo Final</label>
            <select
              name="encerrandoEm"
              defaultValue={searchParams.encerrandoEm ?? ''}
              className="input text-xs"
            >
              <option value="">Qualquer prazo</option>
              <option value="3">Encerra em 3 dias</option>
              <option value="7">Encerra em 7 dias</option>
              <option value="30">Encerra em 30 dias</option>
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
              {hasFilter && (
                <Link href="/editais" className="btn-secondary text-xs py-2">
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
          <span className="text-xs text-slate-400">
            {listData.total > 0
              ? `Mostrando ${offset + 1}–${Math.min(offset + PAGE_SIZE, listData.total)} de ${listData.total} editais`
              : 'Nenhum edital encontrado'}
          </span>
          {hasFilter && (
            <span className="text-[11px] text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-0.5 rounded-full font-medium">
              Filtro ativo
            </span>
          )}
        </div>

        {listData.rows.length === 0 ? (
          <div className="stat-card py-16 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-200 mx-auto" />
            <p className="text-sm text-slate-500 font-medium">
              Nenhum edital encontrado para os filtros selecionados.
            </p>
            <p className="text-xs text-slate-400">
              Você pode cadastrar seleções do Novo PAC / Transferegov no botão acima ou limpar os
              filtros.
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
                        {edital.unidade_nome && edital.unidade_nome !== edital.ministerio && (
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
                                  ? 'text-red-600'
                                  : 'text-slate-600'
                              }
                            >
                              {fmt(edital.data_proposta_fim)}
                            </strong>
                          </span>
                        )}
                        {(edital.keywords_extraidas?.length ?? 0) > 0 && (
                          <span className="text-[11px] text-slate-400">
                            Tags: {edital.keywords_extraidas!.slice(0, 5).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-row lg:flex-col items-center lg:items-end justify-end gap-2 flex-shrink-0">
                      <Link
                        href={`/editais/${edital.id}`}
                        className="btn-primary text-xs py-2 px-3 whitespace-nowrap"
                      >
                        Análise & Prefeitos →
                      </Link>
                      <div className="flex items-center gap-2">
                        {edital.url_fonte && (
                          <a
                            href={edital.url_fonte}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Portal Oficial
                          </a>
                        )}
                        {edital.url_edital && edital.url_edital !== edital.url_fonte && (
                          <a
                            href={edital.url_edital}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Edital
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
            <p className="text-xs text-slate-400">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link
                  href={pageUrl(page - 1)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                >
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
                  <Link
                    key={p}
                    href={pageUrl(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      p === page
                        ? 'bg-brand-700 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
              {page < totalPages && (
                <Link
                  href={pageUrl(page + 1)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
