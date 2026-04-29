import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Landmark, DollarSign, FileText, Scale, ExternalLink,
  Info, TrendingUp, AlertCircle,
} from 'lucide-react';

export const revalidate = 60;

interface PropositionListResponse {
  rows: Array<{
    id: number; type: string; number: number | null; year: number | null;
    title: string | null; status: string | null; presented_at: string | null; url: string | null;
  }>;
  total: number;
}

const PARLAMENTARES = [
  {
    slug: 'individual',
    label: 'Individuais Impositivas',
    desc: 'Execução obrigatória pelo executivo federal. Cada deputado dispõe de cota anual definida pela LDO.',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    dot: 'bg-amber-400',
  },
  {
    slug: 'rp6',
    label: 'Extras (RP6)',
    desc: 'Emendas individuais ao orçamento impositivo, além da cota regular.',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    dot: 'bg-orange-400',
  },
  {
    slug: 'rp7',
    label: 'Relator (RP7)',
    desc: 'Emendas inseridas pelo relator-geral do PLOA, distribuídas por indicação parlamentar.',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    dot: 'bg-yellow-400',
  },
  {
    slug: 'rp8',
    label: 'Bancada Estadual (RP8)',
    desc: 'Emendas de bancadas estaduais, com execução impositiva proporcional.',
    color: 'bg-lime-50 border-lime-200 text-lime-700',
    dot: 'bg-lime-400',
  },
  {
    slug: 'rp9',
    label: 'Comissão (RP9)',
    desc: 'Emendas de comissões permanentes da Câmara ou do Senado.',
    color: 'bg-teal-50 border-teal-200 text-teal-700',
    dot: 'bg-teal-400',
  },
];

const LEG_TYPES = ['PEC', 'PLP'];

export default async function EmendasPage() {
  let legData: PropositionListResponse = { rows: [], total: 0 };
  try {
    legData = await api<PropositionListResponse>('/propositions?type=PEC&limit=50');
    const plp = await api<PropositionListResponse>('/propositions?type=PLP&limit=50');
    legData = { rows: [...legData.rows, ...plp.rows], total: legData.total + plp.total };
  } catch {}

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="page-title">Emendas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Emendas parlamentares orçamentárias e emendas legislativas a normativos
        </p>
      </div>

      {/* ── Parlamentares ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
            <DollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Emendas Parlamentares</h2>
            <p className="text-xs text-slate-500">Orçamentárias — LOA / PLOA</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PARLAMENTARES.map((e) => (
            <div key={e.slug} className={`rounded-xl border p-4 ${e.color} bg-opacity-40`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${e.dot}`} />
                <span className="text-sm font-semibold">{e.label}</span>
              </div>
              <p className="text-xs leading-relaxed opacity-80">{e.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-600 text-sm">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
          <span>
            Os dados orçamentários de emendas parlamentares serão integrados via Portal da Transparência / SIOP.
            Acompanhe os valores executados diretamente em{' '}
            <a
              href="https://portaldatransparencia.gov.br/emendas"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-brand-700 hover:text-brand-800"
            >
              portaldatransparencia.gov.br/emendas
            </a>.
          </span>
        </div>
      </section>

      {/* ── Legislativas ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
            <Scale className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Emendas Legislativas</h2>
            <p className="text-xs text-slate-500">Emendas a PLs, PECs, substitutivos e destaques</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Emenda Constitucional (PEC)', color: 'bg-purple-50 border-purple-200 text-purple-700' },
            { label: 'Emenda a Projeto de Lei',      color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
            { label: 'Substitutivo',                  color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { label: 'Destaque',                      color: 'bg-sky-50 border-sky-200 text-sky-700' },
          ].map(({ label, color }) => (
            <div key={label} className={`rounded-xl border px-4 py-3 text-sm font-medium ${color}`}>
              {label}
            </div>
          ))}
        </div>

        {/* PEC / PLP list from API */}
        <div className="stat-card overflow-hidden !p-0">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              PECs e PLPs apresentadas
            </span>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              {legData.total} registros
            </span>
          </div>

          {legData.rows.length > 0 ? (
            <ul className="divide-y divide-slate-50">
              {legData.rows.map((p) => (
                <li key={p.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors group">
                  <div className="mt-0.5 p-1.5 bg-purple-50 rounded-lg flex-shrink-0">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded-md">
                        {p.type} {p.number}/{p.year}
                      </span>
                      {p.status && (
                        <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                          {p.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-1 line-clamp-2 leading-snug">
                      {p.title ?? '—'}
                    </p>
                    {p.presented_at && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(p.presented_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver na Câmara dos Deputados"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Link
                      href={`/propositions/${p.id}`}
                      className="text-xs text-brand-700 font-medium sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
                    >
                      Detalhes →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-12 text-center">
              <AlertCircle className="w-7 h-7 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Nenhuma PEC ou PLP encontrada.</p>
              <p className="text-xs text-slate-300 mt-1">Rode a ingestão para popular os dados.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
