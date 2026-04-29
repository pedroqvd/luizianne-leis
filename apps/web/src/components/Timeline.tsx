interface Item {
  id: number;
  date: string | null;
  description: string | null;
  status_at_time: string | null;
}

export function Timeline({ items }: { items: Item[] }) {
  if (!items.length) return <p className="text-sm text-slate-400">Sem tramitação registrada.</p>;

  return (
    <ol className="relative border-l-2 border-slate-100 ml-2 space-y-0">
      {items.map((i, idx) => (
        <li key={i.id} className="ml-5 pb-5 last:pb-0">
          <span className={`absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 border-white ${
            idx === 0 ? 'bg-brand-600' : 'bg-slate-300'
          }`} />
          <div className="space-y-0.5">
            <time className="text-[11px] text-slate-400 font-medium">
              {i.date ? new Date(i.date).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              }) : '—'}
            </time>
            <p className="text-sm text-slate-700 leading-snug">{i.description ?? '—'}</p>
            {i.status_at_time && (
              <span className="text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 inline-block">
                {i.status_at_time}
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
