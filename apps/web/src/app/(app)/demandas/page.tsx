export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DemandasClient } from './DemandasClient';

export default async function DemandasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

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
