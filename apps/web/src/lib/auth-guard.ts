import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ALL_TAB_SLUGS, type TabSlug } from '@/lib/navigation';

export interface UserAccessContext {
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
  allowedTabs: string[] | null;
}

export async function getUserAccessContext(): Promise<UserAccessContext> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { userId: null, email: null, isAdmin: false, allowedTabs: null };
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    if (isAdmin) {
      return {
        userId: user.id,
        email: user.email ?? null,
        isAdmin: true,
        allowedTabs: null,
      };
    }

    const { data: perms } = await admin
      .from('user_tab_permissions')
      .select('tab_slug, enabled')
      .eq('user_id', user.id);

    if (!perms?.length) {
      return {
        userId: user.id,
        email: user.email ?? null,
        isAdmin: false,
        allowedTabs: [...ALL_TAB_SLUGS],
      };
    }

    const map = Object.fromEntries(perms.map((p) => [p.tab_slug, p.enabled]));
    const allowedTabs = ALL_TAB_SLUGS.filter((s) => map[s] !== false);
    return {
      userId: user.id,
      email: user.email ?? null,
      isAdmin: false,
      allowedTabs,
    };
  } catch {
    return { userId: null, email: null, isAdmin: false, allowedTabs: null };
  }
}

export async function requireTabAccess(
  slug: TabSlug,
  options?: { isAction?: boolean },
): Promise<{ userId: string; email: string | null; isAdmin: boolean }> {
  const ctx = await getUserAccessContext();
  if (!ctx.userId) {
    if (options?.isAction) throw new Error('Não autenticado');
    redirect('/login');
  }

  const hasAccess =
    ctx.isAdmin || ctx.allowedTabs === null || ctx.allowedTabs.includes(slug);

  if (!hasAccess) {
    if (options?.isAction) {
      throw new Error('Sem permissão para acessar ou modificar dados desta aba');
    }
    redirect('/');
  }

  return { userId: ctx.userId, email: ctx.email, isAdmin: ctx.isAdmin };
}

export async function requireAdminAccess(options?: { isAction?: boolean }) {
  const ctx = await getUserAccessContext();
  if (!ctx.userId) {
    if (options?.isAction) throw new Error('Não autenticado');
    redirect('/login');
  }
  if (!ctx.isAdmin) {
    if (options?.isAction) throw new Error('Acesso restrito a administradores');
    redirect('/');
  }
  return { userId: ctx.userId, email: ctx.email, admin: createAdminClient() };
}

export async function logSecurityAudit(params: {
  actorId: string | null;
  actorEmail?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | number | null;
  metadata?: Record<string, any>;
}) {
  try {
    const admin = createAdminClient();
    await admin.from('security_audit_logs').insert({
      actor_id: params.actorId,
      actor_email: params.actorEmail ?? null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId != null ? String(params.resourceId) : null,
      metadata: params.metadata ?? {},
    });
  } catch {
    // Non-fatal if audit table is not yet migrated in dev
  }
}
