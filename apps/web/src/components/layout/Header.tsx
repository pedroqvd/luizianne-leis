'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Menu } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function MobileHeader() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-7 h-7 bg-brand-700 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">L</span>
        </div>
        <span className="font-semibold text-slate-900 text-sm">Luizianne Lins</span>
      </Link>

      <div className="flex items-center gap-1">
        <Link
          href="/atividade"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <Bell className="w-4 h-4" />
        </Link>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
