import { api } from '@/lib/api';
import { Activity, Bell, FileText, Vote, UserCheck } from 'lucide-react';

export const revalidate = 15;

interface NotificationRow {
  id: number;
  type: string;
  aggregate_type: string;
  aggregate_id: number;
  payload: any;
  created_at: string;
}

const EVENT_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  NEW_PROPOSITION: { label: 'Nova proposição',    icon: FileText,  color: 'bg-blue-50 text-blue-600 border-blue-100' },
  STATUS_CHANGED:  { label: 'Status atualizado',  icon: Activity,  color: 'bg-amber-50 text-amber-600 border-amber-100' },
  NEW_VOTE:        { label: 'Novo voto',           icon: Vote,      color: 'bg-green-50 text-green-600 border-green-100' },
  NEW_RAPPORTEUR:  { label: 'Nova relatoria',      icon: UserCheck, color: 'bg-purple-50 text-purple-600 border-purple-100' },
};

export default async function AtividadePage() {
  let items: NotificationRow[] = [];
  try {
    items = await api<NotificationRow[]>('/notifications?limit=100');
  } catch {}

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="page-title">Atividade recente</h1>
        <p className="text-sm text-slate-500 mt-1">
          Eventos gerados pela ingestão. Atualiza em tempo real (SSE).
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
        {items.length > 0 ? (
          <ul className="divide-y divide-slate-50">
            {items.map((n) => {
              const cfg = EVENT_CONFIG[n.type] ?? {
                label: n.type, icon: Bell, color: 'bg-slate-50 text-slate-500 border-slate-100',
              };
              const Icon = cfg.icon;
              return (
                <li key={n.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                  <div className={`mt-0.5 p-1.5 rounded-lg border ${cfg.color} flex-shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {cfg.label}
                    </p>
                    <p className="text-sm text-slate-700 mt-0.5 line-clamp-2">
                      {n.payload?.title ?? n.payload?.status ?? `${n.aggregate_type} #${n.aggregate_id}`}
                    </p>
                  </div>
                  <time className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                    {new Date(n.created_at).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                  </time>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-16 text-center">
            <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nenhum evento registrado.</p>
            <p className="text-xs text-slate-300 mt-1">Rode a ingestão para gerar atividade.</p>
          </div>
        )}
      </div>
    </div>
  );
}
