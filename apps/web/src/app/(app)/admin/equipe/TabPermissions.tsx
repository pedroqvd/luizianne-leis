'use client';

import { useState, useTransition } from 'react';
import { updateTabPermission } from '@/app/(app)/actions/permissions';

export const ALL_TABS = [
  { slug: 'legislativo', label: 'Legislativo' },
  { slug: 'emendas',     label: 'Emendas' },
  { slug: 'votes',       label: 'Votações' },
  { slug: 'comissoes',   label: 'Comissões' },
  { slug: 'editais',     label: 'Editais' },
  { slug: 'analytics',   label: 'Analytics' },
  { slug: 'atividade',   label: 'Atividade' },
  { slug: 'presenca',    label: 'Presença' },
  { slug: 'demandas',    label: 'Demandas' },
];

interface Props {
  userId: string;
  permissions: Record<string, boolean>;
}

export function TabPermissions({ userId, permissions: initial }: Props) {
  const [perms, setPerms] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle(slug: string) {
    const next = !(perms[slug] ?? true);
    setPerms((p) => ({ ...p, [slug]: next }));
    startTransition(async () => {
      try {
        await updateTabPermission(userId, slug, next);
      } catch {
        setPerms((p) => ({ ...p, [slug]: !next }));
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_TABS.map(({ slug, label }) => {
        const enabled = perms[slug] ?? true;
        return (
          <button
            key={slug}
            onClick={() => toggle(slug)}
            disabled={pending}
            title={enabled ? `Bloquear ${label}` : `Liberar ${label}`}
            className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors disabled:opacity-50 ${
              enabled
                ? 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100'
                : 'bg-slate-100 text-slate-400 border-slate-200 line-through hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
