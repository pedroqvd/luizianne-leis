'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScrollText, Landmark, BarChart3, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/',            label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/legislativo', label: 'Legislativo', icon: ScrollText },
  { href: '/emendas',     label: 'Emendas',     icon: Landmark },
  { href: '/analytics',   label: 'Analytics',   icon: BarChart3 },
  { href: '/atividade',   label: 'Atividade',   icon: Activity },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 bottom-nav-safe">
      <div className="flex">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              isActive(href) ? 'text-brand-700' : 'text-slate-400 hover:text-slate-600',
            )}
          >
            <Icon className={cn(
              'w-5 h-5',
              isActive(href) ? 'text-brand-700' : 'text-slate-400',
            )} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
