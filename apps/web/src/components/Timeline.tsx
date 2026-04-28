interface Item {
  id: number;
  date: string | null;
  description: string | null;
  status_at_time: string | null;
}

export function Timeline({ items }: { items: Item[] }) {
  if (!items.length) return <p className="text-sm text-zinc-500">Sem tramitação registrada.</p>;
  return (
    <ol className="relative border-l border-zinc-200 ml-2">
      {items.map((i) => (
        <li key={i.id} className="ml-4 mb-4">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-brand-500" />
          <time className="text-xs text-zinc-500">
            {i.date ? new Date(i.date).toLocaleString('pt-BR') : '—'}
          </time>
          <p className="text-sm text-zinc-700">{i.description ?? '—'}</p>
          {i.status_at_time && <span className="text-xs text-zinc-500">{i.status_at_time}</span>}
        </li>
      ))}
    </ol>
  );
}
