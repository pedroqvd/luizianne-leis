export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireTabAccess } from '@/lib/auth-guard';
import { DemandasClient } from './DemandasClient';

export default async function DemandasPage() {
  await requireTabAccess('demandas');

  const admin = createAdminClient();
  const [{ data: demands }, { data: members }] = await Promise.all([
    admin
      .from('demands')
      .select('*, assignee:assigned_to(name)')
      .order('created_at', { ascending: false })
      .limit(500),
    admin.from('app_users').select('id, name, email').order('name'),
  ]);

  return <DemandasClient demands={demands ?? []} members={members ?? []} />;
}
