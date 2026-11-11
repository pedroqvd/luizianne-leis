'use server';

import { requireAdminAccess, logSecurityAudit } from '@/lib/auth-guard';
import { revalidatePath } from 'next/cache';

export async function inviteTeamMember(email: string, name: string) {
  const { userId: actorId, email: actorEmail, admin } = await requireAdminAccess({ isAction: true });

  const cleanEmail = String(email ?? '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { error: 'Informe um endereço de e-mail válido.' };
  }
  const cleanName = String(name ?? '').trim().slice(0, 120) || cleanEmail.split('@')[0];

  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : `https://${process.env.VERCEL_URL}`);

  const { data, error } = await admin.auth.admin.inviteUserByEmail(cleanEmail, {
    redirectTo: `${appOrigin}/auth/callback`,
  });
  if (error) return { error: error.message };
  if (!data?.user?.id) return { error: 'Falha ao criar o usuário no sistema' };

  await admin.from('app_users').upsert(
    {
      id: data.user.id,
      email: cleanEmail,
      name: cleanName,
      role: 'member',
    },
    { onConflict: 'id', ignoreDuplicates: true },
  );

  const { data: areas } = await admin.from('notification_areas').select('id');
  if (areas?.length) {
    await admin.from('user_subscriptions').upsert(
      areas.map((a) => ({ user_id: data.user.id, area_id: a.id, enabled: false })),
      { onConflict: 'user_id,area_id', ignoreDuplicates: true },
    );
  }

  await logSecurityAudit({
    actorId,
    actorEmail,
    action: 'TEAM_INVITE_MEMBER',
    resourceType: 'app_users',
    resourceId: data.user.id,
    metadata: { invitedEmail: cleanEmail },
  });

  revalidatePath('/admin/equipe');
  return { success: true };
}

export async function toggleSubscription(userId: string, areaId: number, enabled: boolean) {
  const { userId: actorId, email: actorEmail, admin } = await requireAdminAccess({ isAction: true });

  await admin
    .from('user_subscriptions')
    .upsert({ user_id: userId, area_id: Number(areaId), enabled: Boolean(enabled) });

  await logSecurityAudit({
    actorId,
    actorEmail,
    action: 'TEAM_TOGGLE_SUBSCRIPTION',
    resourceType: 'user_subscriptions',
    resourceId: `${userId}:${areaId}`,
    metadata: { enabled: Boolean(enabled) },
  });

  revalidatePath('/admin/equipe');
}

export async function removeTeamMember(userId: string) {
  const { userId: actorId, email: actorEmail, admin } = await requireAdminAccess({ isAction: true });

  if (userId === actorId) {
    throw new Error('Você não pode remover sua própria conta de administrador.');
  }

  await admin.auth.admin.deleteUser(userId);
  await admin.from('app_users').delete().eq('id', userId);

  await logSecurityAudit({
    actorId,
    actorEmail,
    action: 'TEAM_REMOVE_MEMBER',
    resourceType: 'app_users',
    resourceId: userId,
  });

  revalidatePath('/admin/equipe');
}

export async function updateUserRole(userId: string, role: 'admin' | 'member') {
  const { userId: actorId, email: actorEmail, admin } = await requireAdminAccess({ isAction: true });

  if (role !== 'admin' && role !== 'member') {
    throw new Error('Papel de usuário inválido.');
  }
  if (userId === actorId && role !== 'admin') {
    throw new Error('Você não pode revogar seu próprio acesso de administrador.');
  }

  await admin.from('app_users').update({ role }).eq('id', userId);

  await logSecurityAudit({
    actorId,
    actorEmail,
    action: 'TEAM_UPDATE_ROLE',
    resourceType: 'app_users',
    resourceId: userId,
    metadata: { newRole: role },
  });

  revalidatePath('/admin/equipe');
}
