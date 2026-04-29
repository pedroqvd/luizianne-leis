import { api } from '@/lib/api';
import { Users, Calendar, ExternalLink, Building2 } from 'lucide-react';

export const revalidate = 3600;

interface Commission {
  id: number;
  commission_id: number;
  commission_name: string;
  commission_sigla: string | null;
  role: string | null;
  started_at: string | null;
  ended_at: string | null;
}

function isActive(c: Commission) {
  if (!c.ended_at) return true;
  return new Date(c.ended_at) > new Date();
}

function fmt(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

export default async function ComissoesPage() {
  let commissions: Commission[] = [];
  try {
    // forDeputy endpoint requires internal ID — use the target deputy via summary
    const summary = await api<{ deputy: { id: number } }>('/analytics/summary');
    commissions = await api<Commission[]>(`/commissions/deputy/${summary.deputy.id}`);
  } catch {}

  const ativas = commissions.filter(isActive);
  const anteriores = commissions.filter((c) => !isActive(c));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="page-title">Comissões</h1>
        <p className="text-sm text-slate-500 mt-1">
          Participação em comissões e órgãos da Câmara dos Deputados
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card text-center py-5">
          <p className="text-3xl font-bold text-green-600">{ativas.length}</p>
          <p className="text-xs text-slate-400 mt-1">Comissões ativas</p>
        </div>
        <div className="stat-card text-center py-5">
          <p className="text-3xl font-bold text-slate-500">{anteriores.length}</p>
          <p className="text-xs text-slate-400 mt-1">Anteriores</p>
        </div>
      </div>

      {/* Ativas */}
      {ativas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <h2 className="text-sm font-semibold text-slate-700">Ativas</h2>
          </div>
          <div className="space-y-2">
            {ativas.map((c) => (
              <CommissionCard key={c.id} commission={c} active />
            ))}
          </div>
        </section>
      )}

      {/* Anteriores */}
      {anteriores.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <h2 className="text-sm font-semibold text-slate-500">Anteriores</h2>
          </div>
          <div className="space-y-2">
            {anteriores.map((c) => (
              <CommissionCard key={c.id} commission={c} active={false} />
            ))}
          </div>
        </section>
      )}

      {commissions.length === 0 && (
        <div className="stat-card py-16 text-center">
          <Users className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Nenhuma comissão encontrada.</p>
          <p className="text-xs text-slate-300 mt-1">Rode a ingestão para popular os dados.</p>
        </div>
      )}
    </div>
  );
}

function CommissionCard({ commission: c, active }: { commission: Commission; active: boolean }) {
  const inicio = fmt(c.started_at);
  const fim = fmt(c.ended_at);

  return (
    <div className={`stat-card flex items-start gap-4 ${!active ? 'opacity-60' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        active ? 'bg-brand-50 border border-brand-100' : 'bg-slate-100'
      }`}>
        <Building2 className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-slate-800">{c.commission_name}</h3>
          {c.commission_sigla && (
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
              {c.commission_sigla}
            </span>
          )}
          {active && (
            <span className="text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
              Ativa
            </span>
          )}
        </div>
        {c.role && (
          <p className="text-xs text-slate-500 mt-0.5">{c.role}</p>
        )}
        {(inicio || fim) && (
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            {inicio && <span>{inicio}</span>}
            {inicio && fim && <span>→</span>}
            {fim ? <span>{fim}</span> : <span className="text-green-600 font-medium">presente</span>}
          </div>
        )}
      </div>
    </div>
  );
}
