'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');
  const admin = createAdminClient();
  const { data } = await admin.from('app_users').select('role').eq('id', user.id).single();
  if (data?.role !== 'admin') throw new Error('Sem permissão');
  return admin;
}

export async function updateTabPermission(userId: string, tabSlug: string, enabled: boolean) {
  const admin = await requireAdmin();
  await admin.from('user_tab_permissions').upsert({ user_id: userId, tab_slug: tabSlug, enabled });
  revalidatePath('/admin/equipe');
}
