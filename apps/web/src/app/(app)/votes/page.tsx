import { api } from '@/lib/api';
import Link from 'next/link';
import { Vote, CheckCircle, XCircle, MinusCircle, HelpCircle, UserX, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 100;

interface VoteRow {
  id: number;
  proposition_id: number;
  proposition_title: string | null;
  proposition_type: string | null;
  vote: string;
  date: string | null;
  deputy_name: string | null;
  session_id: string | null;
  is_absence: boolean;
}

interface VoteStats {
  sim: string;
  nao: string;
  abstencao: string;
  obstrucao: string;
  ausente: string;
  total_votados: string;
}

const VOTE_CFG: Record<string, { label: string; badge: string; icon: any; row?: string }> = {
  'Sim':        { label: 'Sim',        badge: 'bg-green-50 text-green-700 border-green-200',    icon: CheckCircle },
  'Não':        { label: 'Não',        badge: 'bg-red-50 text-red-700 border-red-200',          icon: XCircle },
  'Nao':        { label: 'Não',        badge: 'bg-red-50 text-red-700 border-red-200',          icon: XCircle },
  'Abstenção':  { label: 'Abstenção',  badge: 'bg-amber-50 text-amber-700 border-amber-200',    icon: MinusCircle },
  'Abstencao':  { label: 'Abstenção',  badge: 'bg-amber-50 text-amber-700 border-amber-200',    icon: MinusCircle },
  'Obstrução':  { label: 'Obstrução',  badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: MinusCircle },
  'Ausente':    { label: 'Ausente',    badge: 'bg-red-100 text-red-800 border-red-300',         icon: UserX, row: 'bg-red-50/40' },
};

function voteCfg(v: string) {
  return VOTE_CFG[v] ?? { label: v, badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: HelpCircle };
}

function fmt(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function pct(num: string | number, total: number) {
  const n = Number(num);
  if (!total || !n) return 0;
  return Math.round((n / total) * 100);
}

function buildHref(filter?: string, page?: number) {
  const params = new URLSearchParams();
  if (filter) params.set('filter', filter);
  if (page && page > 1) params.set('page', String(page));
  const qs = params.toString();
  return `/votes${qs ? `?${qs}` : ''}`;
}

export default async function VotesPage({
  searchParams,
}: {
  searchParams: { filter?: string; page?: string };
}) {
  const absencesOnly = searchParams.filter === 'ausencias';
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  const [votes, stats] = await Promise.all([
    api<VoteRow[]>(`/votes?limit=${PAGE_SIZE}&offset=${offset}${absencesOnly ? '&absencesOnly=true' : ''}`).catch(() => [] as VoteRow[]),
    api<VoteStats>('/votes/stats/target').catch(() => null),
  ]);

  const sim     = Number(stats?.sim ?? 0);
  const nao     = Number(stats?.nao ?? 0);
  const abst    = Number(stats?.abstencao ?? 0);
  const obst    = Number(stats?.obstrucao ?? 0);
  const ausente = Number(stats?.ausente ?? 0);
  const totalVotados = Number(stats?.total_votados ?? 0);
  const totalRegistros = totalVotados + ausente;

  const totalForFilter = absencesOnly ? ausente : totalRegistros;
  const totalPages = Math.max(1, Math.ceil(totalForFilter / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="page-title">Votações</h1>
        <p className="text-sm text-slate-500 mt-1">
          Histórico completo de votos e ausências em votações nominais
        </p>
      </div>

      {/* Stats */}
      {totalRegistros > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="stat-card text-center py-4">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{sim}</p>
            <p className="text-xs text-slate-400 mt-0.5">Favoráveis</p>
            <p className="text-[10px] text-slate-300 mt-0.5">{pct(sim, totalVotados)}% dos votos</p>
          </div>
          <div className="stat-card text-center py-4">
            <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-600">{nao}</p>
            <p className="text-xs text-slate-400 mt-0.5">Contrários</p>
            <p className="text-[10px] text-slate-300 mt-0.5">{pct(nao, totalVotados)}% dos votos</p>
          </div>
          <div className="stat-card text-center py-4">
            <MinusCircle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">{abst + obst}</p>
            <p className="text-xs text-slate-400 mt-0.5">Abstenções / Obstruções</p>
            <p className="text-[10px] text-slate-300 mt-0.5">{pct(abst + obst, totalVotados)}% dos votos</p>
          </div>
          <div className={`stat-card text-center py-4 ${ausente > 0 ? 'border-red-200 bg-red-50' : ''}`}>
            <UserX className={`w-5 h-5 mx-auto mb-1 ${ausente > 0 ? 'text-red-500' : 'text-slate-300'}`} />
            <p className={`text-2xl font-bold ${ausente > 0 ? 'text-red-700' : 'text-slate-400'}`}>{ausente}</p>
            <p className="text-xs text-slate-400 mt-0.5">Ausências</p>
            <p className="text-[10px] text-slate-300 mt-0.5">{pct(ausente, totalRegistros)}% do total</p>
          </div>
          <div className="stat-card text-center py-4 sm:col-span-1 col-span-2">
            <Vote className="w-5 h-5 text-brand-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-700">{totalVotados}</p>
            <p className="text-xs text-slate-400 mt-0.5">Votos registrados</p>
            <p className="text-[10px] text-slate-300 mt-0.5">nominais + simbólicos</p>
          </div>
        </div>
      )}

      {/* Alerta se há ausências */}
      {ausente > 0 && !absencesOnly && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">
              {ausente} ausência{ausente > 1 ? 's' : ''} detectada{ausente > 1 ? 's' : ''} em votações nominais
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Votações nominais onde o voto da deputada não foi registrado.
            </p>
          </div>
          <Link
            href="/votes?filter=ausencias"
            className="flex-shrink-0 text-xs font-semibold text-red-700 hover:text-red-900 underline underline-offset-2"
          >
            Ver ausências →
          </Link>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/votes"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            !absencesOnly ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos os votos
        </Link>
        <Link
          href="/votes?filter=ausencias"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
            absencesOnly ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserX className="w-3.5 h-3.5" />
          Só ausências {ausente > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${absencesOnly ? 'bg-red-800 text-white' : 'bg-red-100 text-red-700'}`}>{ausente}</span>}
        </Link>
        {totalForFilter > 0 && (
          <span className="ml-auto text-xs text-slate-400">
            {totalForFilter} registro{totalForFilter !== 1 ? 's' : ''} · página {page} de {totalPages}
          </span>
        )}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
        {votes.length > 0 ? (
          <ul className="divide-y divide-slate-50">
            {votes.map((v) => {
              const cfg = voteCfg(v.vote);
              const Icon = cfg.icon;
              return (
                <li
                  key={v.id}
                  className={`px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors group ${cfg.row ?? ''}`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg border flex-shrink-0 ${cfg.badge}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      {v.proposition_type && (
                        <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          {v.proposition_type}
                        </span>
                      )}
                      {v.is_absence && (
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-full">
                          NOMINAL — SEM REGISTRO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-1 line-clamp-2 leading-snug">
                      {v.proposition_title ?? `Proposição #${v.proposition_id}`}
                    </p>
                    {v.is_absence && (
                      <p className="text-xs text-red-600 mt-1">
                        Votação nominal sem registro de voto da deputada
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-slate-400">{fmt(v.date)}</p>
                    <Link
                      href={`/legislativo/${v.proposition_id}`}
                      className="text-[11px] text-brand-600 hover:text-brand-700 font-medium mt-1 inline-block sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
                    >
                      Ver PL →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-16 text-center">
            <Vote className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            {absencesOnly ? (
              <>
                <p className="text-sm text-slate-400 font-medium">Nenhuma ausência registrada.</p>
                <p className="text-xs text-slate-300 mt-1">Ótimo — presença total nas votações nominais!</p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400">Nenhum voto registrado.</p>
                <p className="text-xs text-slate-300 mt-1">Rode a ingestão para popular os dados.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Link
            href={hasPrev ? buildHref(absencesOnly ? 'ausencias' : undefined, page - 1) : '#'}
            aria-disabled={!hasPrev}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hasPrev
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                : 'opacity-40 pointer-events-none bg-white text-slate-400 border-slate-100'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Anterior
          </Link>
          <span className="text-xs text-slate-400">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, totalForFilter)} de {totalForFilter}
          </span>
          <Link
            href={hasNext ? buildHref(absencesOnly ? 'ausencias' : undefined, page + 1) : '#'}
            aria-disabled={!hasNext}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hasNext
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                : 'opacity-40 pointer-events-none bg-white text-slate-400 border-slate-100'
            }`}
          >
            Próxima <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
