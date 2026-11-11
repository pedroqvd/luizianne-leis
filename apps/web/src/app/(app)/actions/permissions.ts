'use server';

import { requireAdminAccess, logSecurityAudit } from '@/lib/auth-guard';
import { ALL_TAB_SLUGS, type TabSlug } from '@/lib/navigation';
import { revalidatePath } from 'next/cache';

export async function updateTabPermission(userId: string, tabSlug: string, enabled: boolean) {
  const { userId: actorId, email: actorEmail, admin } = await requireAdminAccess({ isAction: true });

  if (!ALL_TAB_SLUGS.includes(tabSlug as TabSlug)) {
    throw new Error('Aba inválida.');
  }

  await admin
    .from('user_tab_permissions')
    .upsert({ user_id: userId, tab_slug: tabSlug, enabled: Boolean(enabled) });

  await logSecurityAudit({
    actorId,
    actorEmail,
    action: 'TEAM_UPDATE_TAB_PERMISSION',
    resourceType: 'user_tab_permissions',
    resourceId: `${userId}:${tabSlug}`,
    metadata: { tabSlug, enabled: Boolean(enabled) },
  });

  revalidatePath('/admin/equipe');
}
