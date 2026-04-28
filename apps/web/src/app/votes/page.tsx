import { api } from '@/lib/api';

interface VoteRow {
  id: number;
  proposition_id: number;
  proposition_title: string | null;
  vote: string;
  date: string | null;
  deputy_name: string | null;
}

export const revalidate = 30;

export default async function VotesPage() {
  let votes: VoteRow[] = [];
  try {
    votes = await api<VoteRow[]>('/votes?limit=200');
  } catch {}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Votações</h1>
      <table className="w-full text-sm bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th className="text-left p-3">Data</th>
            <th className="text-left p-3">Proposição</th>
            <th className="text-left p-3">Deputado(a)</th>
            <th className="text-left p-3">Voto</th>
          </tr>
        </thead>
        <tbody>
          {votes.map((v) => (
            <tr key={v.id} className="border-t border-zinc-100">
              <td className="p-3 text-zinc-500">
                {v.date ? new Date(v.date).toLocaleDateString('pt-BR') : '—'}
              </td>
              <td className="p-3">{v.proposition_title ?? `#${v.proposition_id}`}</td>
              <td className="p-3">{v.deputy_name ?? '—'}</td>
              <td className="p-3">
                <span className={badge(v.vote)}>{v.vote}</span>
              </td>
            </tr>
          ))}
          {!votes.length && (
            <tr>
              <td colSpan={4} className="p-6 text-center text-zinc-500">Sem votos registrados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function badge(v: string) {
  const base = 'text-xs px-2 py-0.5 rounded font-medium ';
  switch (v) {
    case 'Sim':       return base + 'bg-green-100 text-green-800';
    case 'Nao':
    case 'Não':       return base + 'bg-red-100 text-red-800';
    case 'Abstencao':
    case 'Abstenção': return base + 'bg-yellow-100 text-yellow-800';
    default:          return base + 'bg-zinc-100 text-zinc-700';
  }
}
