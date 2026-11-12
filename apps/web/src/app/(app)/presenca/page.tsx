export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireTabAccess } from '@/lib/auth-guard';
import { PresenceClient } from './PresenceClient';

export default async function PresencaPage() {
  await requireTabAccess('presenca');

  const admin = createAdminClient();
  const { data: records } = await admin
    .from('presence_records')
    .select('*, creator:created_by(name)')
    .order('date', { ascending: false })
    .limit(200);

  return <PresenceClient records={records ?? []} />;
}
