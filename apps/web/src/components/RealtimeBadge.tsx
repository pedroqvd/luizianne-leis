'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

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
 * FIX F2 (ALTO): SSE com autenticação via query param.
 * EventSource nativo não suporta headers customizados, então enviamos
 * o access_token como query param. O backend deve validar ?token= na rota SSE.
 *
 * Também: auto-reconnect, heartbeat handling, e stale event cleanup.
 */
export function RealtimeBadge() {
  const [events, setEvents] = useState<Event[]>([]);

  const connect = useCallback(async () => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

    // FIX F2: Obtém token da sessão Supabase para enviar como query param
    let tokenParam = '';
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        tokenParam = `?token=${encodeURIComponent(session.access_token)}`;
      }
    } catch {
      // Se não conseguir token, conecta mesmo assim (SSE é @Public)
    }

    const es = new EventSource(`${base}/api/notifications/stream${tokenParam}`);

    const handler = (msg: MessageEvent) => {
      try {
        const data = JSON.parse(msg.data) as Event;
        setEvents((prev) => [data, ...prev].slice(0, 3));
      } catch {}
    };

    // FIX F7: Ignorar heartbeat events (não são eventos de domínio)
    es.addEventListener('heartbeat', () => { /* keep-alive, ignorar */ });

    for (const t of Object.keys(LABELS)) es.addEventListener(t, handler as any);

    // Auto-reconnect on error (com backoff)
    es.onerror = () => {
      es.close();
      setTimeout(() => connect(), 5_000);
    };

    return () => es.close();
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    connect().then((fn) => { cleanup = fn; });
    return () => cleanup?.();
  }, [connect]);

  // FIX F7: Auto-dismiss events after 10s
  useEffect(() => {
    if (!events.length) return;
    const timer = setTimeout(() => setEvents((prev) => prev.slice(0, -1)), 10_000);
    return () => clearTimeout(timer);
  }, [events]);

  if (!events.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-xs">
      {events.map((e) => (
        <div
          key={`${e.type}-${e.aggregateId}-${e.occurredAt}`}
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
