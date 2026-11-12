'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ScrollText, Landmark, BarChart3,
  Activity, Users, LogOut, ChevronRight,
  Vote, Building2, FileSearch, Search, MapPin, ClipboardList, Mic, Receipt, Flag, Handshake,
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

interface Props { isAdmin?: boolean; allowedTabs?: string[] | null }

export function Sidebar({ isAdmin = false, allowedTabs = null }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

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

  function openSearch() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
  }

  return (
    <aside className="hidden lg:flex flex-col w-[240px] min-h-screen bg-sidebar-bg border-r border-white/5 flex-shrink-0">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center">
          <Link
            href="/"
            title="Ir para o Dashboard"
            aria-label="Ir para o Dashboard"
            className="group block bg-white rounded-lg px-2 py-1.5 shadow transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-sidebar-bg"
          >
            <Image
              src="/LOGO-LUIZIANNE-03.png"
              alt="Deputada Federal Luizianne"
              width={160}
              height={32}
              className="h-8 w-auto transition-opacity duration-150 group-hover:opacity-95"
              priority
            />
          </Link>
        </div>
      </div>

      {/* Search shortcut */}
      <div className="px-3 pt-3">
        <button
          onClick={openSearch}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sidebar-text hover:bg-white/10 transition-colors text-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Buscar…</span>
          <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="section-label px-2 mb-2">Navegação</p>
        {navItems
          .filter(({ slug }) => slug === null || allowedTabs === null || allowedTabs.includes(slug))
          .map(({ href, label, icon: Icon, slug }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive(href)
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-colors',
                  isActive(href) ? 'text-brand-400' : 'text-sidebar-text group-hover:text-slate-300',
                )}
              />
              <span className="flex-1 truncate">{label}</span>
              {slug === 'articulacao' && !isActive(href) && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-brand-600/30 text-brand-300 px-1.5 py-0.5 rounded">
                  CE
                </span>
              )}
              {isActive(href) && <ChevronRight className="w-3 h-3 text-brand-400 opacity-70" />}
            </Link>
          ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/5 space-y-0.5">
        {isAdmin && (
          <Link
            href="/admin/equipe"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
              pathname.startsWith('/admin')
                ? 'bg-sidebar-active text-white'
                : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
            )}
          >
            <Users
              className={cn(
                'w-4 h-4 flex-shrink-0',
                pathname.startsWith('/admin') ? 'text-brand-400' : 'text-sidebar-text group-hover:text-slate-300',
              )}
            />
            <span>Equipe</span>
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 text-sidebar-text group-hover:text-red-400" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
