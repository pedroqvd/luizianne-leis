'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { MobileDrawer } from './MobileDrawer';

interface Props {
  isAdmin?: boolean;
  allowedTabs?: string[] | null;
}

export function MobileHeader({ isAdmin = false, allowedTabs = null }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center">
            <Image src="/LOGO-LUIZIANNE-03.png" alt="Deputada Federal Luizianne" width={140} height={28} className="h-7 w-auto" />
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Buscar"
          >
            <Search className="w-4 h-4" />
          </button>
          <Link
            href="/atividade"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Atividade"
          >
            <Bell className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isAdmin={isAdmin}
        allowedTabs={allowedTabs}
      />
    </>
  );
}
