import { api } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { ProductivityChart } from '@/components/ProductivityChart';
import { TypeBreakdown } from '@/components/TypeBreakdown';
import { ProductivityHeatmap } from '@/components/ProductivityHeatmap';
import { TrendingUp, FileText, Users, Award, AlertCircle, GitBranch } from 'lucide-react';

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
  let heatmap: { day: string; total: number }[] = [];

  try {
    [data, heatmap] = await Promise.all([
      api<Summary>('/analytics/summary'),
      api<{ day: string; total: number }[]>('/analytics/heatmap').catch(() => []),
    ]);
  } catch {}

  const prod = data?.productivity;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Deputy header */}
      <div className="flex items-center gap-4">
        {data?.deputy.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.deputy.photo_url}
            alt={data.deputy.name}
            className="w-16 h-16 rounded-2xl border-2 border-white shadow-md object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-brand-700 flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white text-2xl font-bold">L</span>
          </div>
        )}
        <div>
          <h1 className="page-title">{data?.deputy.name ?? 'Luizianne Lins'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {data ? `${data.deputy.party} · ${data.deputy.state} · Deputada Federal` : 'PT · CE · Deputada Federal'}
          </p>
        </div>
      </div>

      {/* Offline warning */}
      {!data && (
        <div className="flex items-start gap-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Backend offline ou banco vazio. Verifique o Render e rode a ingestão.</span>
        </div>
      )}

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="section-label">Total</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{prod?.total_propositions ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Proposições</p>
            </div>
            <div className="p-2 bg-brand-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-brand-700" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="section-label">Autorias</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{prod?.authored ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Como autora</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="section-label">Coautorias</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{prod?.coauthored ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Como coautora</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-xl">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="section-label">Relatorias</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{prod?.rapporteured ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">Como relatora</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-xl">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      </section>

      {/* Heatmap de produtividade */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <GitBranch className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Heatmap de produtividade</h2>
          <span className="text-xs text-slate-400 ml-1">últimos 12 meses</span>
        </div>
        <ProductivityHeatmap data={heatmap} />
      </div>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Proposições por ano</h2>
          <ProductivityChart data={data?.by_year ?? []} />
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Por tipo</h2>
          <TypeBreakdown data={data?.by_type ?? []} />
        </div>
      </section>
    </div>
  );
}
