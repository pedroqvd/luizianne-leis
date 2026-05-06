'use client';

import { useState, useTransition } from 'react';
import { deletePresenceRecord } from '@/app/(app)/actions/presenca';
import { PresenceForm } from './PresenceForm';
import { MapPin, Plus, Trash2, Calendar, Loader2 } from 'lucide-react';

interface PresenceRecord {
  id: number;
  location: 'brasilia' | 'fortaleza';
  date: string;
  type: string;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  creator?: { name: string | null } | null;
}

const TYPE_LABELS: Record<string, string> = {
  expediente: 'Expediente', reuniao: 'Reunião', evento: 'Evento',
  audiencia: 'Audiência Pública', sessao: 'Sessão Plenária',
  comissao: 'Comissão', outro: 'Outro',
};

const LOCATION_COLORS = {
  brasilia:  'bg-blue-50 text-blue-700 border-blue-100',
  fortaleza: 'bg-amber-50 text-amber-700 border-amber-100',
};

function fmt(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' });
}

function groupByMonth(records: PresenceRecord[]) {
  const map = new Map<string, PresenceRecord[]>();
  for (const r of records) {
    const key = r.date.slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return map;
}

interface Props { records: PresenceRecord[] }

export function PresenceClient({ records: initial }: Props) {
  const [records, setRecords] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'todas' | 'brasilia' | 'fortaleza'>('todas');
  const [deleting, startDelete] = useTransition();

  const filtered = filter === 'todas' ? records : records.filter(r => r.location === filter);
  const grouped = groupByMonth(filtered);

  function handleDelete(id: number) {
    if (!confirm('Remover este registro?')) return;
    startDelete(async () => {
      await deletePresenceRecord(id);
      setRecords(r => r.filter(x => x.id !== id));
    });
  }

  const brasilia  = records.filter(r => r.location === 'brasilia').length;
  const fortaleza = records.filter(r => r.location === 'fortaleza').length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Presença no Gabinete</h1>
          <p className="text-sm text-slate-500 mt-1">Histórico de presença em Brasília e Fortaleza.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Registrar Presença
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{records.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total de registros</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{brasilia}</p>
          <p className="text-xs text-slate-400 mt-1">Brasília</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{fortaleza}</p>
          <p className="text-xs text-slate-400 mt-1">Fortaleza</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['todas', 'brasilia', 'fortaleza'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === f
                ? 'bg-brand-700 text-white border-brand-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f === 'todas' ? 'Todas' : f === 'brasilia' ? 'Brasília' : 'Fortaleza'}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-card py-16 text-center text-slate-400 text-sm">
          <Calendar className="w-8 h-8 mx-auto mb-3 opacity-30" />
          Nenhum registro encontrado.
        </div>
      ) : (
        Array.from(grouped.entries()).map(([month, items]) => (
          <div key={month}>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              {new Date(month + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="space-y-3">
              {items.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {r.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photo_url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`badge border text-[11px] ${LOCATION_COLORS[r.location]}`}>
                            <MapPin className="w-3 h-3" />
                            {r.location === 'brasilia' ? 'Brasília' : 'Fortaleza'}
                          </span>
                          <span className="badge border border-slate-100 bg-slate-50 text-slate-600 text-[11px]">
                            {TYPE_LABELS[r.type] ?? r.type}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deleting}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-sm font-medium text-slate-800 mt-1">{fmt(r.date)}</p>
                      {r.notes && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.notes}</p>}
                      {r.creator?.name && (
                        <p className="text-[10px] text-slate-300 mt-1">Registrado por {r.creator.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showForm && <PresenceForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
