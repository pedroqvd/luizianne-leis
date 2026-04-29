'use client';

import { useState } from 'react';
import { inviteTeamMember } from '@/app/(app)/actions/team';
import { Loader2, UserPlus } from 'lucide-react';

export function InviteForm() {
  const [email, setEmail] = useState('');
  const [name, setName]   = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMsg(null);

    const res = await inviteTeamMember(email.trim(), name.trim());
    setLoading(false);

    if ('error' in res && res.error) {
      setMsg({ type: 'err', text: res.error });
    } else {
      setMsg({ type: 'ok', text: `Convite enviado para ${email}` });
      setEmail('');
      setName('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do membro"
          className="input text-sm"
        />
      </div>
      <div className="flex-1 min-w-[240px]">
        <label className="block text-xs font-medium text-slate-600 mb-1.5">E-mail *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
          required
          className="input text-sm"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {loading ? 'Enviando…' : 'Convidar'}
      </button>

      {msg && (
        <p className={`w-full text-sm px-3 py-2 rounded-lg ${
          msg.type === 'ok'
            ? 'text-green-700 bg-green-50 border border-green-100'
            : 'text-brand-700 bg-brand-50 border border-brand-100'
        }`}>
          {msg.text}
        </p>
      )}
    </form>
  );
}
