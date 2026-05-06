'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScrollText, Landmark, FileText, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/',            label: 'Início',      icon: LayoutDashboard, slug: null },
  { href: '/legislativo', label: 'Legislativo', icon: ScrollText,      slug: 'legislativo' },
  { href: '/emendas',     label: 'Emendas',     icon: Landmark,        slug: 'emendas' },
  { href: '/editais',     label: 'Editais',     icon: FileText,        slug: 'editais' },
  { href: '/atividade',   label: 'Atividade',   icon: Activity,        slug: 'atividade' },
];

interface Props { allowedTabs?: string[] | null }

export function BottomNav({ allowedTabs = null }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 bottom-nav-safe">
      <div className="flex">
        {items.filter(({ slug }) => slug === null || allowedTabs === null || allowedTabs.includes(slug)).map(({ href, label, icon: Icon }) => (
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
