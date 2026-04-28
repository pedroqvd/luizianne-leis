import { api } from '@/lib/api';
import { CoauthorshipNetwork } from '@/components/CoauthorshipNetwork';

interface ApprovalData {
  by_status: { status: string; total: number }[];
  overall: { avg_approval: string | null; voted: number; total: number } | null;
}

interface CategoryRow { id: number; slug: string; label: string; total: number }

interface NetworkData {
  center: number;
  nodes: { id: number; name: string; party: string; state: string }[];
  edges: { source: number; target: number; weight: number }[];
}

export const revalidate = 60;

export default async function AnalyticsPage() {
  const [approval, categories, network] = await Promise.all([
    api<ApprovalData>('/analytics/approval').catch(() => ({ by_status: [], overall: null }) as ApprovalData),
    api<CategoryRow[]>('/analytics/categories').catch(() => []),
    api<NetworkData>('/analytics/network').catch(() => null),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      {approval.overall && (
        <section className="bg-white border border-zinc-200 rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs uppercase text-zinc-500">Total de proposições</div>
            <div className="text-2xl font-semibold">{approval.overall.total}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-zinc-500">Foram votadas</div>
            <div className="text-2xl font-semibold">{approval.overall.voted}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-zinc-500">Aprovação média</div>
            <div className="text-2xl font-semibold">
              {approval.overall.avg_approval ?? '—'}%
            </div>
          </div>
        </section>
      )}

      <section className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="text-sm font-medium mb-3">Status das proposições</h2>
        <ul className="grid gap-2 md:grid-cols-2">
          {approval.by_status.map((r) => (
            <li key={r.status} className="flex justify-between text-sm">
              <span className="text-zinc-700">{r.status}</span>
              <span className="font-medium">{r.total}</span>
            </li>
          ))}
        </ul>
      </section>

      {categories.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-lg p-4">
          <h2 className="text-sm font-medium mb-3">Áreas temáticas (NLP)</h2>
          <ul className="grid gap-2 md:grid-cols-3">
            {categories.map((c) => (
              <li key={c.id} className="flex justify-between text-sm">
                <span className="text-zinc-700">{c.label}</span>
                <span className="font-medium">{c.total}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="text-sm font-medium mb-3">Rede de coautoria</h2>
        {network
          ? <CoauthorshipNetwork data={network} />
          : <p className="text-sm text-zinc-500">Sem dados de rede.</p>}
      </section>
    </div>
  );
}
