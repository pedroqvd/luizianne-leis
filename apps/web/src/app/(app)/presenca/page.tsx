export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PresenceClient } from './PresenceClient';

export default async function PresencaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: records } = await admin
    .from('presence_records')
    .select('*, creator:created_by(name)')
    .order('date', { ascending: false })
    .limit(200);

  return <PresenceClient records={records ?? []} />;
}
