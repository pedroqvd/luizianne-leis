'use client';
import { useEffect, useState } from 'react';

interface Event {
  type: string;
  aggregateType: string;
  aggregateId: number;
  payload: any;
  occurredAt: string;
}

const LABELS: Record<string, string> = {
  NEW_PROPOSITION: 'Nova proposição',
  STATUS_CHANGED:  'Status atualizado',
  NEW_VOTE:        'Novo voto',
  NEW_RAPPORTEUR:  'Nova relatoria',
};

/**
 * Toast realtime — escuta SSE em /api/notifications/stream e mostra os
 * últimos 3 eventos no canto da tela. Usa EventSource nativo (sem deps).
 */
export function RealtimeBadge() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    const es = new EventSource(`${base}/api/notifications/stream`);

    const handler = (msg: MessageEvent) => {
      try {
        const data = JSON.parse(msg.data) as Event;
        setEvents((prev) => [data, ...prev].slice(0, 3));
      } catch {}
    };

    for (const t of Object.keys(LABELS)) es.addEventListener(t, handler as any);
    es.onerror = () => es.close();
    return () => es.close();
  }, []);

  if (!events.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-xs">
      {events.map((e, i) => (
        <div
          key={`${e.occurredAt}-${i}`}
          className="bg-white border border-brand-500 shadow-lg rounded-lg px-4 py-2 text-sm animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="text-xs uppercase font-medium text-brand-700">
            {LABELS[e.type] ?? e.type}
          </div>
          <div className="text-zinc-700 truncate">
            {e.payload?.title ?? e.payload?.status ?? `#${e.aggregateId}`}
          </div>
          <div className="text-xs text-zinc-400">
            {new Date(e.occurredAt).toLocaleTimeString('pt-BR')}
          </div>
        </div>
      ))}
    </div>
  );
}
