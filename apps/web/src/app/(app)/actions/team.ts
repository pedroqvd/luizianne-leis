'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const admin = createAdminClient();
  const { data } = await admin
    .from('app_users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (data?.role !== 'admin') throw new Error('Sem permissão');
  return admin;
}

export async function inviteTeamMember(email: string, name: string) {
  const admin = await requireAdmin();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.VERCEL_URL}`}/auth/callback`,
  });
  if (error) return { error: error.message };
  if (!data?.user?.id) return { error: 'Falha ao criar o usuário no sistema' };

  await admin.from('app_users').upsert({
    id: data.user.id,
    email,
    name: name || email.split('@')[0],
    role: 'member',
  });

  const { data: areas } = await admin.from('notification_areas').select('id');
  if (areas?.length) {
    await admin.from('user_subscriptions').upsert(
      areas.map((a) => ({ user_id: data.user.id, area_id: a.id, enabled: false })),
    );
  }

  revalidatePath('/admin/equipe');
  return { success: true };
}

export async function toggleSubscription(userId: string, areaId: number, enabled: boolean) {
  const admin = await requireAdmin();

  await admin
    .from('user_subscriptions')
    .upsert({ user_id: userId, area_id: areaId, enabled });

  revalidatePath('/admin/equipe');
}

export async function removeTeamMember(userId: string) {
  const admin = await requireAdmin();
  await admin.auth.admin.deleteUser(userId);
  await admin.from('app_users').delete().eq('id', userId);
  revalidatePath('/admin/equipe');
}

export async function updateUserRole(userId: string, role: 'admin' | 'member') {
  const admin = await requireAdmin();
  await admin.from('app_users').update({ role }).eq('id', userId);
  revalidatePath('/admin/equipe');
}
