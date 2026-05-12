import { api } from '@/lib/api';
import { Users, Calendar, Building2, Scale } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Commission {
  id: number;
  commission_id: number;
  commission_name: string;
  commission_sigla: string | null;
  commission_tipo: string | null;
  commission_casa: string | null;
  role: string | null;
  started_at: string | null;
  ended_at: string | null;
}

function isActive(c: Commission) {
  if (!c.ended_at) return true;
  // Append T23:59:59 so date-only strings don't parse as UTC midnight,
  // which would incorrectly mark commissions as ended during Brazilian business hours.
  const endsAt = c.ended_at.includes('T') ? c.ended_at : `${c.ended_at}T23:59:59`;
  return new Date(endsAt) > new Date();
}

function fmt(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

function isMista(c: Commission) {
  return c.commission_casa === 'congresso' || c.commission_tipo === 'mista';
}

export default async function ComissoesPage() {
  let commissions: Commission[] = [];
  try {
    commissions = await api<Commission[]>('/commissions/target');
  } catch (e) {
    console.error('[comissoes] failed to fetch commissions:', e);
  }

  const ativas = commissions.filter(isActive);
  const anteriores = commissions.filter((c) => !isActive(c));

  const mistas = ativas.filter(isMista);
  const camara = ativas.filter((c) => !isMista(c));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="page-title">Comissões</h1>
        <p className="text-sm text-slate-500 mt-1">
          Participação em comissões e órgãos — Câmara dos Deputados e Congresso Nacional
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card text-center py-4">
          <p className="text-2xl font-bold text-green-600">{ativas.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Comissões ativas</p>
        </div>
        <div className="stat-card text-center py-4">
          <p className="text-2xl font-bold text-purple-600">{mistas.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Mistas (Congresso)</p>
        </div>
        <div className="stat-card text-center py-4">
          <p className="text-2xl font-bold text-brand-600">{camara.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Câmara dos Dep.</p>
        </div>
        <div className="stat-card text-center py-4">
          <p className="text-2xl font-bold text-slate-500">{anteriores.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Anteriores</p>
        </div>
      </div>

      {/* Mistas — destaque */}
      {mistas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-semibold text-slate-700">Comissões Mistas — Câmara + Senado</h2>
          </div>
          <p className="text-xs text-slate-400 -mt-1">
            Comissões do Congresso Nacional que reúnem deputados e senadores.
          </p>
          <div className="space-y-2">
            {mistas.map((c) => (
              <CommissionCard key={c.id} commission={c} active />
            ))}
          </div>
        </section>
      )}

      {/* Câmara ativas */}
      {camara.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <h2 className="text-sm font-semibold text-slate-700">Câmara dos Deputados — Ativas</h2>
          </div>
          <div className="space-y-2">
            {camara.map((c) => (
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
  const mista = c.commission_casa === 'congresso' || c.commission_tipo === 'mista';

  return (
    <div className={`stat-card flex items-start gap-4 ${!active ? 'opacity-60' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        mista ? 'bg-purple-50 border border-purple-100' :
        active ? 'bg-brand-50 border border-brand-100' : 'bg-slate-100'
      }`}>
        <Building2 className={`w-5 h-5 ${mista ? 'text-purple-600' : active ? 'text-brand-600' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-slate-800">{c.commission_name}</h3>
          {c.commission_sigla && (
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
              {c.commission_sigla}
            </span>
          )}
          {mista && (
            <span className="text-[11px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
              Mista — Câmara + Senado
            </span>
          )}
          {active && !mista && (
            <span className="text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
              Ativa
            </span>
          )}
          {c.commission_tipo && c.commission_tipo !== 'permanente' && !mista && (
            <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full capitalize">
              {c.commission_tipo}
            </span>
          )}
        </div>
        {c.role && (
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{c.role}</p>
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
