import { api } from '@/lib/api';
import { CoauthorshipNetwork } from '@/components/CoauthorshipNetwork';

interface ApprovalRow { status: string; total: number }

interface NetworkData {
  center: number;
  nodes: { id: number; name: string; party: string; state: string }[];
  edges: { source: number; target: number; weight: number }[];
}

export const revalidate = 60;

export default async function AnalyticsPage() {
  const [approval, network] = await Promise.all([
    api<ApprovalRow[]>('/analytics/approval').catch(() => []),
    api<NetworkData>('/analytics/network').catch(() => null),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <section className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="text-sm font-medium mb-3">Status das proposições</h2>
        <ul className="grid gap-2 md:grid-cols-2">
          {approval.map((r) => (
            <li key={r.status} className="flex justify-between text-sm">
              <span className="text-zinc-700">{r.status}</span>
              <span className="font-medium">{r.total}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="text-sm font-medium mb-3">Rede de coautoria</h2>
        {network
          ? <CoauthorshipNetwork data={network} />
          : <p className="text-sm text-zinc-500">Sem dados de rede.</p>}
      </section>
    </div>
  );
}
