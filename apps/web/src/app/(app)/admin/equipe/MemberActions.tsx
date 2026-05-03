'use client';

import { useState, useTransition } from 'react';
import { removeTeamMember, updateUserRole } from '@/app/(app)/actions/team';
import { Trash2, Loader2 } from 'lucide-react';

interface Props {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}

export function MemberActions({ userId, currentRole, isSelf }: Props) {
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState(false);

  function handleRoleChange(role: 'admin' | 'member') {
    startTransition(() => updateUserRole(userId, role));
  }

  function handleRemove() {
    if (!confirm('Remover este membro? Essa ação não pode ser desfeita.')) return;
    setRemoving(true);
    startTransition(async () => {
      await removeTeamMember(userId);
      setRemoving(false);
    });
  }

  if (isSelf) return null;

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentRole}
        onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'member')}
        disabled={pending}
        className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
      >
        <option value="member">Membro</option>
        <option value="admin">Admin</option>
      </select>
      <button
        onClick={handleRemove}
        disabled={pending || removing}
        title="Remover membro"
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
