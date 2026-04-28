import { api } from '@/lib/api';

interface NotificationRow {
  id: number;
  type: string;
  aggregate_type: string;
  aggregate_id: number;
  payload: any;
  created_at: string;
}

const LABELS: Record<string, string> = {
  NEW_PROPOSITION: 'Nova proposição',
  STATUS_CHANGED:  'Status atualizado',
  NEW_VOTE:        'Novo voto',
  NEW_RAPPORTEUR:  'Nova relatoria',
};

export const revalidate = 15;

export default async function NotificationsPage() {
  let items: NotificationRow[] = [];
  try {
    items = await api<NotificationRow[]>('/notifications?limit=100');
  } catch {}

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Atividade recente</h1>
        <p className="text-sm text-zinc-500">
          Eventos de domínio gerados pela ingestão. Atualiza em tempo real (SSE).
        </p>
      </header>

      <ul className="divide-y divide-zinc-200 bg-white border border-zinc-200 rounded-lg">
        {items.map((n) => (
          <li key={n.id} className="p-4 flex justify-between items-start gap-4">
            <div>
              <div className="text-xs uppercase font-medium text-brand-700">
                {LABELS[n.type] ?? n.type}
              </div>
              <div className="text-sm text-zinc-700">
                {n.payload?.title ?? n.payload?.status ?? `${n.aggregate_type} #${n.aggregate_id}`}
              </div>
            </div>
            <time className="text-xs text-zinc-500 whitespace-nowrap">
              {new Date(n.created_at).toLocaleString('pt-BR')}
            </time>
          </li>
        ))}
        {!items.length && (
          <li className="p-6 text-center text-sm text-zinc-500">
            Nenhum evento registrado. Rode a ingestão para gerar atividade.
          </li>
        )}
      </ul>
    </div>
  );
}
