'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function setupUser({
  id,
  email,
  name,
}: {
  id: string;
  email: string;
  name?: string | null;
}) {
  const admin = createAdminClient();
  const adminEmail = process.env.ADMIN_EMAIL;

  const { count } = await admin
    .from('app_users')
    .select('*', { count: 'exact', head: true });

  const role = count === 0 || email === adminEmail ? 'admin' : 'member';

  await admin.from('app_users').upsert(
    {
      id,
      email,
      name: name ?? email.split('@')[0],
      role,
    },
    { onConflict: 'id', ignoreDuplicates: false },
  );

  const { data: areas } = await admin.from('notification_areas').select('id');
  if (areas?.length) {
    await admin.from('user_subscriptions').upsert(
      areas.map((a) => ({ user_id: id, area_id: a.id, enabled: false })),
      { onConflict: 'user_id,area_id', ignoreDuplicates: true },
    );
  }
}
