'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logSecurityAudit } from '@/lib/auth-guard';

/**
 * Inicializa o registro do usuário autenticado em `app_users` de forma segura:
 * - Identidade (`id` e `email`) obtida exclusivamente da sessão autenticada no servidor.
 * - Nunca sobrescreve `role` de um usuário já existente (impede escalada ou rebaixamento acidental).
 */
export async function setupUser(opts?: {
  id?: string;
  email?: string;
  name?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    throw new Error('Sessão inválida ou usuário não autenticado');
  }

  const userId = user.id;
  const userEmail = user.email;
  const candidateName =
    opts?.name?.trim() ||
    user.user_metadata?.full_name?.trim() ||
    userEmail.split('@')[0];

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('app_users')
    .select('id, role, name')
    .eq('id', userId)
    .maybeSingle();

  if (!existing) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const { count } = await admin
      .from('app_users')
      .select('*', { count: 'exact', head: true });

    const role =
      count === 0 || (adminEmail && userEmail.toLowerCase() === adminEmail)
        ? 'admin'
        : 'member';

    await admin.from('app_users').insert({
      id: userId,
      email: userEmail,
      name: candidateName,
      role,
    });

    await logSecurityAudit({
      actorId: userId,
      actorEmail: userEmail,
      action: 'AUTH_SETUP_NEW_USER',
      resourceType: 'app_users',
      resourceId: userId,
      metadata: { role },
    });
  } else if (!existing.name && candidateName) {
    await admin
      .from('app_users')
      .update({ name: candidateName })
      .eq('id', userId);
  }

  const { data: areas } = await admin.from('notification_areas').select('id');
  if (areas?.length) {
    await admin.from('user_subscriptions').upsert(
      areas.map((a) => ({ user_id: userId, area_id: a.id, enabled: false })),
      { onConflict: 'user_id,area_id', ignoreDuplicates: true },
    );
  }
}
