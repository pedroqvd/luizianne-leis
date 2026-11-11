'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard, ScrollText, Landmark, BarChart3,
  Activity, Users, LogOut, Vote, Building2, FileSearch,
  MapPin, ClipboardList, Mic, Receipt, Flag, Handshake, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { ALL_TABS, type TabSlug } from '@/lib/navigation';

const ICON_BY_SLUG: Record<TabSlug, any> = {
  articulacao: Handshake,
  editais:     FileSearch,
  emendas:     Landmark,
  demandas:    ClipboardList,
  legislativo: ScrollText,
  votes:       Vote,
  comissoes:   Building2,
  analytics:   BarChart3,
  atividade:   Activity,
  despesas:    Receipt,
  discursos:   Mic,
  frentes:     Flag,
  presenca:    MapPin,
};

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, slug: null as TabSlug | null },
  ...ALL_TABS.map((t) => ({
    href: t.href,
    label: t.label,
    icon: ICON_BY_SLUG[t.slug] ?? FileSearch,
    slug: t.slug as TabSlug | null,
  })),
];

interface Props {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  allowedTabs?: string[] | null;
}

export function MobileDrawer({ open, onClose, isAdmin = false, allowedTabs = null }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch {}
    router.push('/login');
    router.refresh();
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const visibleItems = navItems.filter(
    ({ slug }) => slug === null || allowedTabs === null || allowedTabs.includes(slug),
  );

  return (
    <>
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-sidebar-bg flex flex-col transform transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <span className="text-white font-semibold text-sm">Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sidebar-text hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-2">
            Navegação
          </p>
          {visibleItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive(href)
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isActive(href) ? 'text-brand-400' : 'text-sidebar-text',
                )}
              />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
          {isAdmin && (
            <Link
              href="/admin/equipe"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                pathname.startsWith('/admin')
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
              )}
            >
              <Users className="w-4 h-4 flex-shrink-0 text-sidebar-text" />
              <span>Equipe</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-all duration-150"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
}
