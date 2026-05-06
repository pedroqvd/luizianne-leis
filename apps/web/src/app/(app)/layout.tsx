export const dynamic = 'force-dynamic';

import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileHeader } from '@/components/layout/Header';
import { RealtimeBadge } from '@/components/RealtimeBadge';
import { CommandPalette } from '@/components/CommandPalette';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function getUserContext(): Promise<{ isAdmin: boolean; allowedTabs: string[] | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isAdmin: false, allowedTabs: null };

    const admin = createAdminClient();
    const { data: profile } = await admin.from('app_users').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';
    if (isAdmin) return { isAdmin: true, allowedTabs: null };

    const { data: perms } = await admin
      .from('user_tab_permissions').select('tab_slug, enabled').eq('user_id', user.id);
    if (!perms?.length) return { isAdmin: false, allowedTabs: null };

    const ALL_SLUGS = ['legislativo','emendas','votes','comissoes','editais','analytics','atividade','presenca','demandas'];
    const map = Object.fromEntries(perms.map(p => [p.tab_slug, p.enabled]));
    const allowedTabs = ALL_SLUGS.filter(s => map[s] !== false);
    return { isAdmin, allowedTabs };
  } catch {
    return { isAdmin: false, allowedTabs: null };
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, allowedTabs } = await getUserContext();

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar isAdmin={isAdmin} allowedTabs={allowedTabs} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
      <BottomNav allowedTabs={allowedTabs} />
      <RealtimeBadge />
      <CommandPalette />
    </div>
  );
}
