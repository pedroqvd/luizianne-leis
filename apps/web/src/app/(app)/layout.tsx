export const dynamic = 'force-dynamic';

import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileHeader } from '@/components/layout/Header';
import { RealtimeBadge } from '@/components/RealtimeBadge';
import { CommandPalette } from '@/components/CommandPalette';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function getIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const admin = createAdminClient();
    const { data } = await admin
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();
    return data?.role === 'admin';
  } catch {
    return false;
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await getIsAdmin();

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
      <RealtimeBadge />
      <CommandPalette />
    </div>
  );
}
