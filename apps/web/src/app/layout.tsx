import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { RealtimeBadge } from '@/components/RealtimeBadge';

export const metadata: Metadata = {
  title: 'Luizianne Leis — Transparência Legislativa',
  description: 'Acompanhamento em tempo real da atuação parlamentar',
};

const nav = [
  { href: '/',             label: 'Dashboard' },
  { href: '/propositions', label: 'Proposições' },
  { href: '/votes',        label: 'Votações' },
  { href: '/analytics',    label: 'Analytics' },
  { href: '/notifications', label: 'Atividade' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-brand-700 text-lg">
              Luizianne Leis
            </Link>
            <nav className="flex gap-6 text-sm">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-brand-500">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-zinc-500">
          Dados oficiais — API da Câmara dos Deputados.
        </footer>
        <RealtimeBadge />
      </body>
    </html>
  );
}
