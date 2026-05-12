'use client';

import { useState, useTransition } from 'react';
import { createDemandaAndReturn, updateDemanda, type DemandaInput } from '@/app/(app)/actions/demandas';
import { X, Loader2 } from 'lucide-react';

export const CATEGORIES = [
  'saúde', 'educação', 'infraestrutura', 'trabalho', 'habitação',
  'assistência social', 'meio ambiente', 'segurança pública', 'transporte', 'geral',
];

export const PRIORITIES = [
  { value: 'urgente', label: 'Urgente', color: 'text-red-600' },
  { value: 'alta',    label: 'Alta',    color: 'text-orange-600' },
  { value: 'normal',  label: 'Normal',  color: 'text-slate-600' },
  { value: 'baixa',   label: 'Baixa',   color: 'text-slate-400' },
];

export const STATUSES = [
  { value: 'novo',          label: 'Novo',              color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { value: 'em_andamento',  label: 'Em andamento',      color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { value: 'aguardando',    label: 'Aguardando',         color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { value: 'resolvido',     label: 'Resolvido',          color: 'bg-green-50 text-green-700 border-green-100' },
  { value: 'arquivado',     label: 'Arquivado',          color: 'bg-slate-100 text-slate-500 border-slate-200' },
];

interface Member { id: string; name: string | null; email: string }

interface Props {
  onClose: (created?: any) => void;
  members: Member[];
  initial?: (DemandaInput & { id: number }) | null;
}

export function DemandaModal({ onClose, members, initial }: Props) {
  const [title, setTitle]                   = useState(initial?.title ?? '');
  const [requesterName, setRequesterName]   = useState(initial?.requester_name ?? '');
  const [requesterContact, setContact]      = useState(initial?.requester_contact ?? '');
  const [description, setDescription]       = useState(initial?.description ?? '');
  const [category, setCategory]             = useState(initial?.category ?? 'geral');
  const [status, setStatus]                 = useState(initial?.status ?? 'novo');
  const [priority, setPriority]             = useState(initial?.priority ?? 'normal');
  const [assignedTo, setAssignedTo]         = useState(initial?.assigned_to ?? '');
  const [dueDate, setDueDate]               = useState(initial?.due_date ?? '');
  const [notes, setNotes]                   = useState(initial?.notes ?? '');
  const [error, setError]                   = useState('');
  const [pending, startTransition]          = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Título é obrigatório.'); return; }

    const data: DemandaInput = {
      title: title.trim(),
      requester_name:    requesterName || undefined,
      requester_contact: requesterContact || undefined,
      description:       description || undefined,
      category,
      status,
      priority,
      assigned_to: assignedTo || null,
      due_date:    dueDate || null,
      notes:       notes || undefined,
    };

    startTransition(async () => {
      try {
        if (initial) {
          const updated = await updateDemanda(initial.id, data);
          onClose(updated);
        } else {
          const created = await createDemandaAndReturn(data);
          onClose(created);
        }
      } catch (e: any) {
        setError(e.message ?? 'Erro ao salvar.');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-slate-900">
            {initial ? 'Editar Demanda' : 'Nova Demanda'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Resumo da demanda" className="input w-full" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Solicitante</label>
              <input value={requesterName} onChange={e => setRequesterName(e.target.value)} placeholder="Nome" className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contato</label>
              <input value={requesterContact} onChange={e => setContact(e.target.value)} placeholder="Tel / e-mail" className="input w-full" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Detalhes da solicitação…" className="input w-full resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input w-full">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prioridade</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="input w-full">
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="input w-full">
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prazo</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input w-full" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Responsável</label>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="input w-full">
              <option value="">Ninguém</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name ?? m.email}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notas internas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Andamentos, observações…" className="input w-full resize-none" />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn border border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="flex-1 btn-primary justify-center">
              {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
