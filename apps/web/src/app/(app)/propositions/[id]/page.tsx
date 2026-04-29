import { api } from '@/lib/api';
import { Timeline } from '@/components/Timeline';

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

export default async function PropositionDetailPage({ params }: { params: { id: string } }) {
  const data = await api<Detail>(`/propositions/${params.id}`);

  return (
    <article className="space-y-6">
      <header className="space-y-1">
        <div className="text-xs text-zinc-500">
          {data.type} {data.number}/{data.year}
        </div>
        <h1 className="text-xl font-semibold">{data.title}</h1>
        <div className="text-sm text-zinc-500">Status: {data.status ?? '—'}</div>
      </header>

      {data.summary && (
        <section>
          <h2 className="text-sm font-medium mb-1">Ementa</h2>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{data.summary}</p>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium mb-2">Autores</h2>
        <ul className="flex flex-wrap gap-2">
          {data.authors.map((a) => (
            <li key={`${a.id}-${a.role}`} className="text-xs px-2 py-1 bg-zinc-100 rounded">
              <span className="font-medium">{a.name}</span>
              <span className="text-zinc-500"> · {a.role} · {a.party}/{a.state}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-2">Tramitação</h2>
        <Timeline items={data.proceedings} />
      </section>
    </article>
  );
}
