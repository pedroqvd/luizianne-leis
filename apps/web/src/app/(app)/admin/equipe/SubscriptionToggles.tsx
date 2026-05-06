'use client';

import { useState, useTransition } from 'react';
import { toggleSubscription } from '@/app/(app)/actions/team';

interface Props {
  userId: string;
  areaId: number;
  enabled: boolean;
  isSelf: boolean;
}

export function SubscriptionToggles({ userId, areaId, enabled: initial, isSelf }: Props) {
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      try {
        await toggleSubscription(userId, areaId, next);
      } catch {
        setEnabled(!next); // revert optimistic update on failure
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      title={enabled ? 'Desativar notificação' : 'Ativar notificação'}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? 'bg-brand-700' : 'bg-slate-200'
      } ${pending ? 'opacity-60' : ''}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
