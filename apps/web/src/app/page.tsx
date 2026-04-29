import { api } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { ProductivityChart } from '@/components/ProductivityChart';
import { TypeBreakdown } from '@/components/TypeBreakdown';

export const revalidate = 60;

interface Summary {
  deputy: { name: string; party: string; state: string; photo_url?: string };
  productivity: {
    authored: number;
    coauthored: number;
    rapporteured: number;
    total_propositions: number;
  } | null;
  by_type: { type: string; total: number }[];
  by_year: { year: number; total: number }[];
}

export default async function DashboardPage() {
  let data: Summary | null = null;
  try {
    data = await api<Summary>('/analytics/summary');
  } catch {
    // backend offline — render placeholder
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        {data?.deputy.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.deputy.photo_url}
            alt={data.deputy.name}
            className="w-16 h-16 rounded-full border border-zinc-200"
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{data?.deputy.name ?? 'Luizianne Lins'}</h1>
          <p className="text-sm text-zinc-500">
            {data ? `${data.deputy.party} — ${data.deputy.state}` : 'Backend indisponível'}
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total"      value={data?.productivity?.total_propositions ?? 0} />
        <StatCard label="Autorias"   value={data?.productivity?.authored ?? 0} />
        <StatCard label="Coautorias" value={data?.productivity?.coauthored ?? 0} />
        <StatCard label="Relatorias" value={data?.productivity?.rapporteured ?? 0} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <h2 className="text-sm font-medium text-zinc-700 mb-2">Proposições por ano</h2>
          <ProductivityChart data={data?.by_year ?? []} />
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <h2 className="text-sm font-medium text-zinc-700 mb-2">Por tipo</h2>
          <TypeBreakdown data={data?.by_type ?? []} />
        </div>
      </section>

      {!data && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Backend offline ou banco vazio. Rode a migração e a ingestão para popular os dados.
        </div>
      )}
    </div>
  );
}
