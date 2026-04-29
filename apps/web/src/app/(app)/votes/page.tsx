import { api } from '@/lib/api';
import Link from 'next/link';
import { Vote, ExternalLink, CheckCircle, XCircle, MinusCircle, HelpCircle } from 'lucide-react';

export const revalidate = 30;

interface VoteRow {
  id: number;
  proposition_id: number;
  proposition_title: string | null;
  proposition_type: string | null;
  vote: string;
  date: string | null;
  deputy_name: string | null;
  session_id: string | null;
}

const VOTE_CFG: Record<string, { label: string; badge: string; icon: any }> = {
  'Sim':        { label: 'Sim',        badge: 'bg-green-50 text-green-700 border-green-200',   icon: CheckCircle },
  'Não':        { label: 'Não',        badge: 'bg-red-50 text-red-700 border-red-200',         icon: XCircle },
  'Nao':        { label: 'Não',        badge: 'bg-red-50 text-red-700 border-red-200',         icon: XCircle },
  'Abstenção':  { label: 'Abstenção',  badge: 'bg-amber-50 text-amber-700 border-amber-200',   icon: MinusCircle },
  'Abstencao':  { label: 'Abstenção',  badge: 'bg-amber-50 text-amber-700 border-amber-200',   icon: MinusCircle },
  'Obstrução':  { label: 'Obstrução',  badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: MinusCircle },
};

function voteCfg(v: string) {
  return VOTE_CFG[v] ?? { label: v, badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: HelpCircle };
}

function fmt(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function VotesPage() {
  let votes: VoteRow[] = [];
  try {
    votes = await api<VoteRow[]>('/votes?limit=200');
  } catch {}

  const stats = {
    sim: votes.filter((v) => v.vote === 'Sim').length,
    nao: votes.filter((v) => ['Não', 'Nao'].includes(v.vote)).length,
    abst: votes.filter((v) => ['Abstenção', 'Abstencao'].includes(v.vote)).length,
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="page-title">Votações</h1>
        <p className="text-sm text-slate-500 mt-1">
          Histórico de votos da deputada em plenário e comissões
        </p>
      </div>

      {/* Stats */}
      {votes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card text-center py-4">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{stats.sim}</p>
            <p className="text-xs text-slate-400 mt-0.5">Favoráveis</p>
          </div>
          <div className="stat-card text-center py-4">
            <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-600">{stats.nao}</p>
            <p className="text-xs text-slate-400 mt-0.5">Contrários</p>
          </div>
          <div className="stat-card text-center py-4">
            <MinusCircle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">{stats.abst}</p>
            <p className="text-xs text-slate-400 mt-0.5">Abstenções</p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
        {votes.length > 0 ? (
          <ul className="divide-y divide-slate-50">
            {votes.map((v) => {
              const cfg = voteCfg(v.vote);
              const Icon = cfg.icon;
              return (
                <li key={v.id} className="px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors group">
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
                    </div>
                    <p className="text-sm text-slate-700 mt-1 line-clamp-2 leading-snug">
                      {v.proposition_title ?? `Proposição #${v.proposition_id}`}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-slate-400">{fmt(v.date)}</p>
                    <Link
                      href={`/propositions/${v.proposition_id}`}
                      className="text-[11px] text-brand-600 hover:text-brand-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block"
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
            <p className="text-sm text-slate-400">Nenhum voto registrado.</p>
            <p className="text-xs text-slate-300 mt-1">Rode a ingestão para popular os dados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
