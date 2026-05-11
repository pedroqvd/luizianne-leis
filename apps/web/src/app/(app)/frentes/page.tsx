import { api } from '@/lib/api';
import { Flag, ExternalLink, Hash } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Frente {
  id: number;
  external_id: number;
  titulo: string;
  keywords: string | null;
  id_legislatura: number | null;
  url_website: string | null;
  role: string | null;
}

interface FrentesStats {
  total: number;
  legislaturas: number;
}

export default async function FrentesPage() {
  const [frentes, stats] = await Promise.all([
    api<Frente[]>('/frentes').catch(() => [] as Frente[]),
    api<FrentesStats>('/frentes/stats').catch(() => null),
  ]);

  // Group by legislatura
  const byLeg = new Map<number | null, Frente[]>();
  for (const f of frentes) {
    const key = f.id_legislatura ?? null;
    if (!byLeg.has(key)) byLeg.set(key, []);
    byLeg.get(key)!.push(f);
  }
  const legs = [...byLeg.keys()].sort((a, b) => (b ?? 0) - (a ?? 0));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="page-title">Frentes Parlamentares</h1>
        <p className="text-sm text-slate-500 mt-1">
          Grupos temáticos suprapartidários da Câmara dos Deputados dos quais a deputada é signatária
        </p>
      </div>

      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card text-center py-4">
            <p className="text-2xl font-bold text-brand-600">{stats.total}</p>
            <p className="text-xs text-slate-400 mt-0.5">Frentes parlamentares</p>
          </div>
          <div className="stat-card text-center py-4">
            <p className="text-2xl font-bold text-slate-700">{stats.legislaturas}</p>
            <p className="text-xs text-slate-400 mt-0.5">Legislaturas</p>
          </div>
        </div>
      )}

      {/* Por legislatura */}
      {legs.map((leg) => (
        <section key={leg ?? 'sem-leg'} className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            {leg ? `${leg}ª Legislatura` : 'Sem legislatura'}
          </h2>
          <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
            <ul className="divide-y divide-slate-50">
              {byLeg.get(leg)!.map((f) => (
                <li key={f.id} className="px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors group">
                  <div className="mt-0.5 p-1.5 rounded-lg border border-brand-100 bg-brand-50 flex-shrink-0">
                    <Flag className="w-3.5 h-3.5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium text-slate-800 leading-snug">{f.titulo}</h3>
                      {f.url_website && (
                        <a
                          href={f.url_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-[11px] text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
                        >
                          Site <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {f.role && f.role !== 'Titular' && (
                      <span className="inline-block mt-1 text-[11px] bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded-full font-medium">
                        {f.role}
                      </span>
                    )}
                    {f.keywords && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {f.keywords.split(',').slice(0, 6).map((kw) => kw.trim()).filter(Boolean).map((kw) => (
                          <span key={kw} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                            <Hash className="w-2.5 h-2.5" />{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {frentes.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-card py-16 text-center">
          <Flag className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Nenhuma frente parlamentar encontrada.</p>
          <p className="text-xs text-slate-300 mt-1">
            Rode <code className="bg-slate-100 px-1 rounded">POST /frentes/ingest</code> para sincronizar.
          </p>
        </div>
      )}
    </div>
  );
}
