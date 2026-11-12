'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { buildEndpointUrl } from '@/lib/api-url';

interface SyncCounts {
  editais?: number;
  propositions?: number;
  frentes?: number;
  discursos?: number;
  ceap?: number;
  emendas?: number;
}

export function AutoSyncBanner({ initialEmpty }: { initialEmpty: boolean }) {
  const router = useRouter();
  const [counts, setCounts] = useState<SyncCounts | null>(null);
  const [waking, setWaking] = useState(true);

  useEffect(() => {
    if (!initialEmpty) return;

    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch(buildEndpointUrl('/admin/auto-sync'), {
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) {
          const body = await res.json();
          if (cancelled) return;
          setWaking(false);
          if (body?.counts) {
            setCounts(body.counts);
            if ((body.counts.propositions ?? 0) > 0) {
              router.refresh();
            }
          } else {
            router.refresh();
          }
        }
      } catch {
        // Servidor ainda acordando — tenta novamente no próximo ciclo
      }
    }

    void poll();
    const interval = setInterval(() => {
      void poll();
    }, 6_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [initialEmpty, router]);

  if (!initialEmpty) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-brand-800 bg-brand-50/70 border border-brand-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <RefreshCw className="w-4 h-4 flex-shrink-0 mt-0.5 animate-spin text-brand-700" />
        <div>
          <p className="font-semibold text-slate-900">
            {waking
              ? 'Conectando e despertando o motor automático de dados...'
              : 'Sincronização automática em andamento em segundo plano'}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Os dados oficiais da Câmara, PNCP e Portal da Transparência estão sendo coletados automaticamente. A tela atualizará sozinha assim que os lotes chegarem.
          </p>
        </div>
      </div>

      {counts && (
        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-700">
          <span className="px-2 py-1 rounded-md bg-white border border-slate-200">
            Proposições: <strong>{counts.propositions ?? 0}</strong>
          </span>
          <span className="px-2 py-1 rounded-md bg-white border border-slate-200">
            Editais: <strong>{counts.editais ?? 0}</strong>
          </span>
          <span className="px-2 py-1 rounded-md bg-white border border-slate-200">
            Frentes: <strong>{counts.frentes ?? 0}</strong>
          </span>
          <span className="px-2 py-1 rounded-md bg-white border border-slate-200">
            Discursos: <strong>{counts.discursos ?? 0}</strong>
          </span>
          <span className="px-2 py-1 rounded-md bg-white border border-slate-200">
            CEAP: <strong>{counts.ceap ?? 0}</strong>
          </span>
          <span className="px-2 py-1 rounded-md bg-white border border-slate-200">
            Emendas: <strong>{counts.emendas ?? 0}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
