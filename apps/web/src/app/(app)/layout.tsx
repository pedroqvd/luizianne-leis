import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileHeader } from '@/components/layout/Header';
import { RealtimeBadge } from '@/components/RealtimeBadge';
import { CommandPalette } from '@/components/CommandPalette';
import { getUserAccessContext } from '@/lib/auth-guard';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, allowedTabs } = await getUserAccessContext();

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar isAdmin={isAdmin} allowedTabs={allowedTabs} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileHeader isAdmin={isAdmin} allowedTabs={allowedTabs} />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
      <BottomNav allowedTabs={allowedTabs} />
      <RealtimeBadge />
      <CommandPalette isAdmin={isAdmin} allowedTabs={allowedTabs} />
    </div>
  );
}
