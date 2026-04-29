import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileHeader } from '@/components/layout/Header';
import { RealtimeBadge } from '@/components/RealtimeBadge';

export const metadata: Metadata = {
  title: 'Luizianne Lins — Plataforma da Equipe',
  description: 'Gestão legislativa e acompanhamento parlamentar',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Luizianne' },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <div className="flex h-screen overflow-hidden">
          {/* Desktop sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Mobile header */}
            <MobileHeader />

            {/* Page content */}
            <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                {children}
              </div>
            </main>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />

        {/* Realtime toast */}
        <RealtimeBadge />
      </body>
    </html>
  );
}
