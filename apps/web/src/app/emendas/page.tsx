import { Landmark, Construction } from 'lucide-react';

export default function EmendasPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="page-title">Emendas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Emendas parlamentares e legislativas da deputada
        </p>
      </div>

      {/* Two sections */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Landmark className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Emendas Parlamentares</h2>
              <p className="text-xs text-slate-500">Orçamentárias (LOA)</p>
            </div>
          </div>
          <ul className="text-xs text-slate-500 space-y-1 mt-3">
            {['Individuais Impositivas', 'Extras (RP6)', 'Bancada Estadual (RP8)', 'Comissão (RP9)', 'Relator (RP7)'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Landmark className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Emendas Legislativas</h2>
              <p className="text-xs text-slate-500">Normativos e constitucionais</p>
            </div>
          </div>
          <ul className="text-xs text-slate-500 space-y-1 mt-3">
            {['Emenda Constitucional (PEC)', 'Emenda a Projeto de Lei', 'Substitutivo', 'Destaque'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Coming soon */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card py-16 text-center">
        <Construction className="w-10 h-10 text-slate-200 mx-auto mb-4" />
        <p className="text-sm font-medium text-slate-500">Em desenvolvimento</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          A ingestão de emendas está sendo implementada. Os dados serão populados automaticamente quando disponíveis.
        </p>
      </div>
    </div>
  );
}
