import { api } from '@/lib/api';
import { CoauthorshipNetwork } from '@/components/CoauthorshipNetwork';
import { BarChart3, CheckCircle, TrendingUp, Users, AlertCircle } from 'lucide-react';

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

const STATUS_COLORS: Record<string, string> = {
  'Aprovado':       'bg-green-50 text-green-700 border-green-200',
  'Rejeitado':      'bg-red-50 text-red-700 border-red-200',
  'Em tramitação':  'bg-blue-50 text-blue-700 border-blue-200',
  'Arquivado':      'bg-slate-50 text-slate-600 border-slate-200',
};

function statusColor(s: string) {
  return STATUS_COLORS[s] ?? 'bg-slate-50 text-slate-600 border-slate-200';
}

export default async function AnalyticsPage() {
  const [approval, categories, network] = await Promise.all([
    api<ApprovalData>('/analytics/approval').catch(() => ({ by_status: [], overall: null }) as ApprovalData),
    api<CategoryRow[]>('/analytics/categories').catch(() => [] as CategoryRow[]),
    api<NetworkData>('/analytics/network').catch(() => null),
  ]);

  const hasData = approval.overall !== null;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Análise de aprovação, áreas temáticas e rede de coautoria
        </p>
      </div>

      {!hasData && (
        <div className="flex items-start gap-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Backend offline ou banco vazio — rode a ingestão para gerar os dados analíticos.</span>
        </div>
      )}

      {/* KPI summary */}
      {approval.overall && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label">Total</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{approval.overall.total}</p>
                <p className="text-xs text-slate-400 mt-1">Proposições</p>
              </div>
              <div className="p-2 bg-brand-50 rounded-xl"><TrendingUp className="w-5 h-5 text-brand-700" /></div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label">Votadas</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{approval.overall.voted}</p>
                <p className="text-xs text-slate-400 mt-1">Foram a votação</p>
              </div>
              <div className="p-2 bg-green-50 rounded-xl"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-label">Aprovação média</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {approval.overall.avg_approval != null ? `${approval.overall.avg_approval}%` : '—'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Nas votadas</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-xl"><BarChart3 className="w-5 h-5 text-blue-600" /></div>
            </div>
          </div>
        </section>
      )}

      {/* Status breakdown */}
      {approval.by_status.length > 0 && (
        <section className="stat-card space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Status das proposições</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {approval.by_status.map((r) => (
              <li
                key={r.status}
                className={`flex justify-between items-center text-sm px-3 py-2 rounded-lg border ${statusColor(r.status)}`}
              >
                <span className="font-medium">{r.status}</span>
                <span className="font-bold text-base">{r.total}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="stat-card space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Áreas temáticas (NLP)</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const pct = approval.overall ? Math.round((c.total / approval.overall.total) * 100) : 0;
              return (
                <li key={c.id} className="flex flex-col gap-1.5 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-700 font-medium truncate">{c.label}</span>
                    <span className="font-bold text-slate-900 ml-2 flex-shrink-0">{c.total}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400">{pct}% do total</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Coauthorship network */}
      <section className="stat-card space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Rede de coautoria</h2>
          {network && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-auto">
              {network.nodes.length} deputados · {network.edges.length} coautorias
            </span>
          )}
        </div>
        {network
          ? <CoauthorshipNetwork data={network} />
          : (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Sem dados de rede de coautoria.</p>
            </div>
          )}
      </section>
    </div>
  );
}
