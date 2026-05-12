'use client';

import { useState, useTransition } from 'react';
import { deleteDemanda, updateDemandaStatus, createDemandaAndReturn, type DemandaInput } from '@/app/(app)/actions/demandas';
import { DemandaModal, STATUSES, PRIORITIES } from './DemandaModal';
import { Plus, Pencil, Trash2, Loader2, ClipboardList, AlertCircle, Calendar, User } from 'lucide-react';

interface Member { id: string; name: string | null; email: string }

interface Demand {
  id: number;
  title: string;
  requester_name: string | null;
  requester_contact: string | null;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  assignee?: { name: string | null } | null;
}

interface Props { demands: Demand[]; members: Member[] }

const PRIORITY_DOT: Record<string, string> = {
  urgente: 'bg-red-500', alta: 'bg-orange-400', normal: 'bg-slate-300', baixa: 'bg-slate-200',
};

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function isOverdue(due: string | null, status: string) {
  if (!due || status === 'resolvido' || status === 'arquivado') return false;
  return new Date(due) < new Date();
}

export function DemandasClient({ demands: initial, members }: Props) {
  const [demands, setDemands]     = useState(initial);
  const [activeFilter, setFilter] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<(DemandaInput & { id: number }) | null>(null);
  const [pending, startTransition] = useTransition();

  const filters = [
    { key: 'todas',         label: 'Todas',         count: demands.length },
    { key: 'novo',          label: 'Novos',          count: demands.filter(d => d.status === 'novo').length },
    { key: 'em_andamento',  label: 'Em andamento',   count: demands.filter(d => d.status === 'em_andamento').length },
    { key: 'aguardando',    label: 'Aguardando',      count: demands.filter(d => d.status === 'aguardando').length },
    { key: 'resolvido',     label: 'Resolvidos',      count: demands.filter(d => d.status === 'resolvido').length },
    { key: 'arquivado',     label: 'Arquivados',      count: demands.filter(d => d.status === 'arquivado').length },
  ];

  const filtered = activeFilter === 'todas' ? demands : demands.filter(d => d.status === activeFilter);

  function openEdit(d: Demand) {
    setEditing({
      id: d.id, title: d.title,
      requester_name: d.requester_name ?? undefined,
      requester_contact: d.requester_contact ?? undefined,
      description: d.description ?? undefined,
      category: d.category, status: d.status, priority: d.priority,
      assigned_to: d.assigned_to, due_date: d.due_date,
      notes: d.notes ?? undefined,
    });
    setShowModal(true);
  }

  function handleDelete(id: number) {
    if (!confirm('Excluir esta demanda?')) return;
    startTransition(async () => {
      await deleteDemanda(id);
      setDemands(ds => ds.filter(d => d.id !== id));
    });
  }

  function cycleStatus(d: Demand) {
    if (d.status === 'arquivado') return; // arquivado is terminal — no cycling
    const order = ['novo', 'em_andamento', 'aguardando', 'resolvido'];
    const idx = order.indexOf(d.status);
    const next = order[(idx + 1) % order.length];
    startTransition(async () => {
      await updateDemandaStatus(d.id, next);
      setDemands(ds => ds.map(x => x.id === d.id ? { ...x, status: next } : x));
    });
  }

  const statusInfo = (s: string) => STATUSES.find(x => x.value === s) ?? STATUSES[0];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Demandas Espontâneas</h1>
          <p className="text-sm text-slate-500 mt-1">Solicitações recebidas e seu acompanhamento.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Nova Demanda
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['novo','em_andamento','aguardando','resolvido'].map((s) => {
          const info = statusInfo(s);
          const n = demands.filter(d => d.status === s).length;
          return (
            <div key={s} className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
              <p className={`text-2xl font-bold ${info.color.split(' ').find(c => c.startsWith('text-'))}`}>{n}</p>
              <p className="text-xs text-slate-400 mt-0.5">{info.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeFilter === f.key
                ? 'bg-brand-700 text-white border-brand-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label} <span className="ml-1 opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-card py-16 text-center text-slate-400 text-sm">
          <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-30" />
          Nenhuma demanda encontrada.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const si = statusInfo(d.status);
            const pi = PRIORITIES.find(p => p.value === d.priority);
            const overdue = isOverdue(d.due_date, d.status);
            return (
              <div key={d.id} className="bg-white rounded-xl border border-slate-100 shadow-card p-4 hover:shadow-card-hover transition-shadow">
                <div className="flex items-start gap-3">
                  {/* Priority dot */}
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[d.priority] ?? 'bg-slate-300'}`} title={pi?.label} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{d.title}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-slate-300 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(d.id)} disabled={pending} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {d.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{d.description}</p>}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Status (clicável para avançar) */}
                      <button
                          onClick={() => cycleStatus(d)}
                          disabled={pending || d.status === 'arquivado'}
                          title={d.status === 'arquivado' ? 'Demanda arquivada' : 'Clique para avançar status'}
                        >
                        <span className={`badge border text-[11px] ${d.status === 'arquivado' ? 'cursor-default' : 'cursor-pointer hover:opacity-80'} ${si.color}`}>
                          {si.label}
                        </span>
                      </button>

                      {/* Category */}
                      <span className="badge border border-slate-100 bg-slate-50 text-slate-500 text-[11px]">
                        {d.category}
                      </span>

                      {/* Requester */}
                      {d.requester_name && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <User className="w-3 h-3" />{d.requester_name}
                        </span>
                      )}

                      {/* Assignee */}
                      {d.assignee?.name && (
                        <span className="text-[11px] text-slate-400">→ {d.assignee.name}</span>
                      )}

                      {/* Due date */}
                      {d.due_date && (
                        <span className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
                          {overdue && <AlertCircle className="w-3 h-3" />}
                          <Calendar className="w-3 h-3" />{fmtDate(d.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <DemandaModal
          onClose={(result) => {
            if (result) {
              if (editing) {
                setDemands(ds => ds.map(d => d.id === result.id ? result : d));
              } else {
                setDemands(ds => [result, ...ds]);
              }
            }
            setShowModal(false);
            setEditing(null);
          }}
          members={members}
          initial={editing}
        />
      )}
    </div>
  );
}
