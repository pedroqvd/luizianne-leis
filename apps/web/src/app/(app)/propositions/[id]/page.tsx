import { api } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, FileText, Users, GitBranch, Clock } from 'lucide-react';

interface Detail {
  id: number;
  type: string;
  number: number | null;
  year: number | null;
  title: string | null;
  summary: string | null;
  status: string | null;
  url: string | null;
  presented_at: string | null;
  authors: Array<{ id: number; name: string; party: string; state: string; role: string }>;
  proceedings: Array<{ id: number; date: string | null; description: string | null; status_at_time: string | null }>;
}

const TYPE_COLORS: Record<string, string> = {
  PL:  'bg-blue-50 text-blue-700 border-blue-100',
  PEC: 'bg-purple-50 text-purple-700 border-purple-100',
  PLP: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  REQ: 'bg-amber-50 text-amber-700 border-amber-100',
  INC: 'bg-slate-50 text-slate-600 border-slate-100',
};

export default async function PropositionDetailPage({ params }: { params: { id: string } }) {
  let data: Detail | null = null;
  try {
    data = await api<Detail>(`/propositions/${params.id}`);
  } catch {}

  if (!data) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <Link href="/legislativo" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Legislativo
        </Link>
        <div className="stat-card py-16 text-center">
          <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Proposição não encontrada.</p>
        </div>
      </div>
    );
  }

  const typeBadge = TYPE_COLORS[data.type] ?? 'bg-slate-50 text-slate-600 border-slate-100';

  return (
    <article className="space-y-6 animate-fade-in-up">
      {/* Back */}
      <Link href="/legislativo" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Legislativo
      </Link>

      {/* Header card */}
      <div className="stat-card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${typeBadge}`}>
            {data.type} {data.number}/{data.year}
          </span>
          {data.status && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
              {data.status}
            </span>
          )}
          {data.presented_at && (
            <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
              <Clock className="w-3.5 h-3.5" />
              Apresentada em {new Date(data.presented_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

        <h1 className="text-lg font-semibold text-slate-900 leading-snug">
          {data.title ?? '—'}
        </h1>

        {data.url && (
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-800 font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver na Câmara dos Deputados
          </a>
        )}
      </div>

      {/* Ementa */}
      {data.summary && (
        <section className="stat-card space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Ementa</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{data.summary}</p>
        </section>
      )}

      {/* Authors */}
      {data.authors.length > 0 && (
        <section className="stat-card space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">
              Autores <span className="font-normal text-slate-400">({data.authors.length})</span>
            </h2>
          </div>
          <ul className="flex flex-wrap gap-2">
            {data.authors.map((a) => (
              <li
                key={`${a.id}-${a.role}`}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg"
              >
                <span className="font-medium text-slate-800">{a.name}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{a.role}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{a.party}/{a.state}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Proceedings / Timeline */}
      <section className="stat-card space-y-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">
            Tramitação <span className="font-normal text-slate-400">({data.proceedings.length} eventos)</span>
          </h2>
        </div>

        {data.proceedings.length > 0 ? (
          <ol className="relative border-l-2 border-slate-100 ml-2 space-y-0">
            {data.proceedings.map((p, idx) => (
              <li key={p.id} className="ml-5 pb-5 last:pb-0">
                <span
                  className={`absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center ${
                    idx === 0 ? 'bg-brand-600' : 'bg-slate-300'
                  }`}
                />
                <div className="space-y-0.5">
                  <time className="text-[11px] text-slate-400 font-medium">
                    {p.date ? new Date(p.date).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    }) : '—'}
                  </time>
                  <p className="text-sm text-slate-700 leading-snug">{p.description ?? '—'}</p>
                  {p.status_at_time && (
                    <span className="text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      {p.status_at_time}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-400 py-4 text-center">Sem tramitação registrada.</p>
        )}
      </section>
    </article>
  );
}
