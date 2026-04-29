import { api } from '@/lib/api';
import Link from 'next/link';
import {
  FileText, ExternalLink, Calendar, Building2,
  AlertCircle, CheckCircle, PauseCircle, Clock,
  DollarSign, TrendingUp, Filter,
} from 'lucide-react';

export const revalidate = 120;

interface Edital {
  id: number;
  pncp_id: string | null;
  titulo: string;
  orgao: string;
  ministerio: string;
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
  unidade_nome: string | null;
}

interface EditalStats {
  abertos: number;
  encerrados: number;
  suspensos: number;
  revogados: number;
  encerrando_7d: number;
  encerrando_30d: number;
  valor_total_abertos: string;
  ministerios_ativos: number;
  total: number;
}

interface ListResponse { rows: Edital[]; total: number }

const SITUACAO: Record<string, { label: string; badge: string; icon: any }> = {
  aberto:    { label: 'Aberto',    badge: 'text-green-700 bg-green-50 border-green-200',  icon: CheckCircle },
  encerrado: { label: 'Encerrado', badge: 'text-slate-600 bg-slate-100 border-slate-200', icon: CheckCircle },
  suspenso:  { label: 'Suspenso',  badge: 'text-amber-700 bg-amber-50 border-amber-200',  icon: PauseCircle },
  revogado:  { label: 'Revogado',  badge: 'text-red-700 bg-red-50 border-red-200',        icon: AlertCircle },
};

function fmt(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtBRL(v?: number | string | null) {
  if (!v) return null;
  const n = Number(v);
  if (isNaN(n) || n === 0) return null;
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
  if (days === null) return null;
  if (days < 0) return null;
  if (days <= 3)  return <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-full animate-pulse">Encerra em {days}d</span>;
  if (days <= 7)  return <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">Encerra em {days}d</span>;
  if (days <= 30) return <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">Encerra em {days}d</span>;
  return null;
}

export default async function EditaisPage({
  searchParams,
}: {
  searchParams: {
    situacao?: string; ministerio?: string; modalidade?: string;
    uf?: string; search?: string; encerrandoEm?: string;
  };
}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) if (v) qs.set(k, v);
  qs.set('limit', '60');

  const [listData, stats, ministries] = await Promise.all([
    api<ListResponse>(`/editais?${qs}`).catch(() => ({ rows: [], total: 0 })),
    api<EditalStats>('/editais/stats').catch(() => null),
    api<string[]>('/editais/ministries').catch(() => [] as string[]),
  ]);

  const hasFilter = Object.values(searchParams).some(Boolean);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="page-title">Editais Federais</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor em tempo real de editais abertos nos ministérios e órgãos do governo federal — fonte: PNCP
        </p>
      </div>

      {/* KPI Stats */}
      {stats && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label">Abertos</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.abertos}</p>
                <p className="text-xs text-slate-400 mt-1">editais ativos</p>
              </div>
              <div className="p-2 bg-green-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label">Encerrando em 7d</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.encerrando_7d}</p>
                <p className="text-xs text-slate-400 mt-1">{stats.encerrando_30d} em 30 dias</p>
              </div>
              <div className="p-2 bg-red-50 rounded-xl">
                <Clock className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label">Valor total</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {fmtBRL(stats.valor_total_abertos) ?? '—'}
                </p>
                <p className="text-xs text-slate-400 mt-1">em abertos</p>
              </div>
              <div className="p-2 bg-brand-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-brand-600" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label">Ministérios</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.ministerios_ativos}</p>
                <p className="text-xs text-slate-400 mt-1">com editais abertos</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filtros */}
      <div className="stat-card">
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Buscar</label>
            <input
              name="search"
              defaultValue={searchParams.search ?? ''}
              placeholder="Título, órgão ou objeto…"
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Ministério / Órgão</label>
            <select name="ministerio" defaultValue={searchParams.ministerio ?? ''} className="input text-sm">
              <option value="">Todos</option>
              {ministries.map((m) => (
                <option key={m} value={m}>{m.length > 50 ? m.slice(0, 50) + '…' : m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Situação</label>
            <select name="situacao" defaultValue={searchParams.situacao ?? ''} className="input text-sm">
              <option value="">Todas</option>
              <option value="aberto">Abertos</option>
              <option value="encerrado">Encerrados</option>
              <option value="suspenso">Suspensos</option>
              <option value="revogado">Revogados</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Prazo</label>
            <select name="encerrandoEm" defaultValue={searchParams.encerrandoEm ?? ''} className="input text-sm">
              <option value="">Qualquer</option>
              <option value="3">Encerra em 3d</option>
              <option value="7">Encerra em 7d</option>
              <option value="30">Encerra em 30d</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
            <button type="submit" className="btn-primary">
              <Filter className="w-3.5 h-3.5" /> Filtrar
            </button>
            {hasFilter && (
              <Link href="/editais" className="btn-secondary">Limpar</Link>
            )}
          </div>
        </form>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {hasFilter ? `${listData.total} resultado(s)` : `${listData.total} editais`}
          </span>
        </div>

        {listData.rows.length === 0 ? (
          <div className="stat-card py-16 text-center">
            <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            {stats?.total === 0 ? (
              <>
                <p className="text-sm text-slate-500 font-medium">Nenhum edital ingerido ainda</p>
                <p className="text-xs text-slate-400 mt-1">
                  Acione a ingestão via Swagger: <code className="bg-slate-100 px-1 rounded">POST /admin/ingest-editais</code>
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Nenhum edital encontrado para os filtros selecionados.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {listData.rows.map((edital) => {
              const s = SITUACAO[edital.situacao] ?? SITUACAO.encerrado;
              const Icon = s.icon;
              const valor = fmtBRL(edital.valor_estimado);

              return (
                <div key={edital.id} className="stat-card hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-brand-600" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Badges linha 1 */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${s.badge}`}>
                          <Icon className="w-3 h-3" /> {s.label}
                        </span>
                        <EncerrandoBadge dataFim={edital.data_proposta_fim} situacao={edital.situacao} />
                        {edital.modalidade && (
                          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {edital.modalidade}
                          </span>
                        )}
                        {valor && (
                          <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
                            {valor}
                          </span>
                        )}
                      </div>

                      {/* Título */}
                      <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                        {edital.titulo}
                      </h3>

                      {/* Órgão */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="font-medium text-slate-700 line-clamp-1">{edital.orgao}</span>
                        </span>
                        {edital.uf && <span className="text-slate-400">{edital.uf}</span>}
                        {edital.numero && <span className="text-slate-400">Nº {edital.numero}</span>}
                      </div>

                      {/* Objeto */}
                      {edital.objeto && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{edital.objeto}</p>
                      )}

                      {/* Datas */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-0.5">
                        {edital.data_publicacao && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Publicado: <strong className="text-slate-600">{fmt(edital.data_publicacao)}</strong>
                          </span>
                        )}
                        {edital.data_proposta_inicio && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Abertura: <strong className="text-slate-600">{fmt(edital.data_proposta_inicio)}</strong>
                          </span>
                        )}
                        {edital.data_proposta_fim && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Encerra: <strong className={`${daysUntil(edital.data_proposta_fim) !== null && daysUntil(edital.data_proposta_fim)! <= 7 ? 'text-red-600' : 'text-slate-600'}`}>
                              {fmt(edital.data_proposta_fim)}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                      {edital.url_fonte && (
                        <a
                          href={edital.url_fonte}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 whitespace-nowrap"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> PNCP
                        </a>
                      )}
                      {edital.url_edital && edital.url_edital !== edital.url_fonte && (
                        <a
                          href={edital.url_edital}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 whitespace-nowrap"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Edital
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info fonte */}
      <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-blue-800 text-xs">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
        <span>
          Dados provenientes do <strong>PNCP (Portal Nacional de Contratações Públicas)</strong>.
          Atualizado automaticamente a cada 6 horas. Cobertura: esfera federal (todos os ministérios e autarquias).
        </span>
      </div>
    </div>
  );
}
