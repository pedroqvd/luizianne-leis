'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireTabAccess, logSecurityAudit } from '@/lib/auth-guard';
import { revalidatePath } from 'next/cache';

const ALLOWED_STATUSES = new Set(['novo', 'em_andamento', 'aguardando', 'resolvido', 'arquivado']);
const ALLOWED_PRIORITIES = new Set(['baixa', 'normal', 'alta', 'urgente']);

export interface DemandaInput {
  title: string;
  requester_name?: string;
  requester_contact?: string;
  description?: string;
  category: string;
  status: string;
  priority: string;
  assigned_to?: string | null;
  due_date?: string | null;
  notes?: string;
}

function sanitizeDemandaFields(data: Partial<DemandaInput>, isCreate: boolean) {
  const out: Record<string, any> = {};

  if (data.title !== undefined) {
    const t = String(data.title).trim().slice(0, 300);
    if (!t) throw new Error('O título da demanda é obrigatório');
    out.title = t;
  } else if (isCreate) {
    throw new Error('O título da demanda é obrigatório');
  }

  if (data.requester_name !== undefined) {
    out.requester_name = data.requester_name ? String(data.requester_name).trim().slice(0, 200) : null;
  }
  if (data.requester_contact !== undefined) {
    out.requester_contact = data.requester_contact ? String(data.requester_contact).trim().slice(0, 200) : null;
  }
  if (data.description !== undefined) {
    out.description = data.description ? String(data.description).trim().slice(0, 4000) : null;
  }
  if (data.category !== undefined) {
    out.category = String(data.category).trim().slice(0, 60) || 'geral';
  } else if (isCreate) {
    out.category = 'geral';
  }
  if (data.status !== undefined) {
    if (!ALLOWED_STATUSES.has(data.status)) throw new Error('Status de demanda inválido');
    out.status = data.status;
  } else if (isCreate) {
    out.status = 'novo';
  }
  if (data.priority !== undefined) {
    if (!ALLOWED_PRIORITIES.has(data.priority)) throw new Error('Prioridade de demanda inválida');
    out.priority = data.priority;
  } else if (isCreate) {
    out.priority = 'normal';
  }
  if (data.assigned_to !== undefined) {
    out.assigned_to = data.assigned_to ? String(data.assigned_to).trim() : null;
  }
  if (data.due_date !== undefined) {
    out.due_date = data.due_date ? String(data.due_date).slice(0, 10) : null;
  }
  if (data.notes !== undefined) {
    out.notes = data.notes ? String(data.notes).trim().slice(0, 4000) : null;
  }

  out.updated_at = new Date().toISOString();
  return out;
}

async function requireOwnershipAssigneeOrAdmin(
  demandaId: number,
  userId: string,
  isAdmin: boolean,
  allowAssignee: boolean,
) {
  if (isAdmin) return;

  const admin = createAdminClient();
  const { data: demand } = await admin
    .from('demands')
    .select('created_by, assigned_to')
    .eq('id', demandaId)
    .single();

  if (!demand) throw new Error('Demanda não encontrada');
  const isCreator = demand.created_by === userId;
  const isAssignee = allowAssignee && demand.assigned_to === userId;

  if (!isCreator && !isAssignee) {
    throw new Error('Sem permissão para modificar esta demanda');
  }
}

export async function updateDemanda(id: number, data: Partial<DemandaInput>) {
  const { userId, email, isAdmin } = await requireTabAccess('demandas', { isAction: true });
  await requireOwnershipAssigneeOrAdmin(id, userId, isAdmin, true);

  const payload = sanitizeDemandaFields(data, false);
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('demands')
    .update(payload)
    .eq('id', id)
    .select('*, assignee:assigned_to(name)')
    .single();
  if (error) throw new Error(error.message);

  await logSecurityAudit({
    actorId: userId,
    actorEmail: email,
    action: 'DEMANDA_UPDATE',
    resourceType: 'demands',
    resourceId: id,
    metadata: { fields: Object.keys(payload) },
  });

  revalidatePath('/demandas');
  return row;
}

export async function deleteDemanda(id: number) {
  const { userId, email, isAdmin } = await requireTabAccess('demandas', { isAction: true });
  await requireOwnershipAssigneeOrAdmin(id, userId, isAdmin, false);

  const admin = createAdminClient();
  const { error } = await admin.from('demands').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await logSecurityAudit({
    actorId: userId,
    actorEmail: email,
    action: 'DEMANDA_DELETE',
    resourceType: 'demands',
    resourceId: id,
  });

  revalidatePath('/demandas');
}

export async function createDemandaAndReturn(data: DemandaInput) {
  const { userId, email } = await requireTabAccess('demandas', { isAction: true });
  const payload = sanitizeDemandaFields(data, true);

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('demands')
    .insert({ ...payload, created_by: userId })
    .select('*, assignee:assigned_to(name)')
    .single();
  if (error) throw new Error(error.message);

  await logSecurityAudit({
    actorId: userId,
    actorEmail: email,
    action: 'DEMANDA_CREATE',
    resourceType: 'demands',
    resourceId: row.id,
    metadata: { title: payload.title, category: payload.category },
  });

  revalidatePath('/demandas');
  return row;
}

export async function updateDemandaStatus(id: number, status: string) {
  await updateDemanda(id, { status });
}
