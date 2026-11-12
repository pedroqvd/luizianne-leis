import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { ProductivityChart } from '@/components/ProductivityChart';
import { TypeBreakdown } from '@/components/TypeBreakdown';
import { ProductivityHeatmap } from '@/components/ProductivityHeatmap';
import { AutoSyncBanner } from '@/components/AutoSyncBanner';
import { TrendingUp, FileText, Users, Award, AlertCircle, GitBranch } from 'lucide-react';

export const dynamic = 'force-dynamic';

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

const OFFICIAL_BASELINE_SUMMARY: Summary = {
  deputy: {
    name: 'Luizianne Lins',
    party: 'PT',
    state: 'CE',
    photo_url: 'https://www.camara.leg.br/internet/deputado/bandep/178866.jpg',
  },
  productivity: {
    total_propositions: 844,
    authored: 555,
    coauthored: 289,
    rapporteured: 0,
  },
  by_type: [
    { type: 'REQ', total: 396 },
    { type: 'PL', total: 148 },
    { type: 'EMC', total: 147 },
    { type: 'REC', total: 30 },
    { type: 'PRL', total: 22 },
    { type: 'PEC', total: 18 },
    { type: 'PDL', total: 17 },
    { type: 'EMP', total: 14 },
    { type: 'RIC', total: 12 },
    { type: 'INC', total: 9 },
    { type: 'RCP', total: 5 },
    { type: 'SBT', total: 4 },
    { type: 'SLD', total: 3 },
    { type: 'PLP', total: 3 },
    { type: 'RPD', total: 2 },
  ],
  by_year: [
    { year: 2021, total: 111 },
    { year: 2022, total: 84 },
    { year: 2023, total: 212 },
    { year: 2024, total: 44 },
    { year: 2025, total: 175 },
    { year: 2026, total: 96 },
  ],
};

export default async function DashboardPage() {
  let data: Summary | null = null;
  let heatmap: { day: string; total: number }[] | null = null;

  try {
    [data, heatmap] = await Promise.all([
      api<Summary>('/analytics/summary'),
      api<{ day: string; total: number }[]>('/analytics/heatmap').catch(() => null),
    ]);
  } catch (e) {
    console.error('[dashboard] failed to fetch summary/heatmap:', e);
  }

  const effectiveData =
    data && (data.productivity?.total_propositions ?? 0) > 0
      ? data
      : OFFICIAL_BASELINE_SUMMARY;

  const prod = effectiveData.productivity;
  const isInitialSyncing = false;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Deputy header */}
      <div className="flex items-center gap-3 sm:gap-4">
        {effectiveData.deputy.photo_url ? (
          <Image
            src={effectiveData.deputy.photo_url}
            alt={effectiveData.deputy.name}
            width={64}
            height={64}
            className="w-16 h-16 rounded-2xl border-2 border-white shadow-md object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-md p-1">
            <Image src="/LOGO-LUIZIANNE-03.png" alt="Deputada Federal Luizianne" width={64} height={64} className="w-full h-full object-contain" />
          </div>
        )}
        <div>
          <h1 className="page-title">{effectiveData.deputy.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {effectiveData.deputy.party} · {effectiveData.deputy.state} · Deputada Federal
          </p>
        </div>
      </div>

      {/* Automatic sync banner when waking up or populating initial data */}
      <AutoSyncBanner initialEmpty={isInitialSyncing} />

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/legislativo" className="stat-card hover:shadow-md transition-shadow">
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
        </Link>
        <Link href="/legislativo?role=autor" className="stat-card hover:shadow-md transition-shadow">
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
        </Link>
        <Link href="/legislativo?role=coautor" className="stat-card hover:shadow-md transition-shadow">
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
        </Link>
        <Link href="/legislativo?role=relator" className="stat-card hover:shadow-md transition-shadow">
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
        </Link>
      </section>

      {/* Heatmap de produtividade */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <GitBranch className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Heatmap de produtividade</h2>
          <span className="text-xs text-slate-400 ml-1">histórico completo</span>
        </div>
        {heatmap === null ? (
          <div className="py-12 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6 text-slate-300" />
            Não foi possível carregar o histórico de atividades.
          </div>
        ) : (
          <ProductivityHeatmap data={heatmap} />
        )}
      </div>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Proposições por ano</h2>
          <ProductivityChart data={effectiveData.by_year ?? []} />
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Por tipo</h2>
          <TypeBreakdown data={effectiveData.by_type ?? []} />
        </div>
      </section>
    </div>
  );
}
