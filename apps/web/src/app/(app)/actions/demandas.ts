'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function currentUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');
  return user.id;
}

/**
 * FIX F3: Verifica se o usuário é admin OU dono da demanda.
 * Sem isso, qualquer membro autenticado poderia modificar/deletar demandas de outros.
 */
async function requireOwnershipOrAdmin(demandaId: number, userId: string) {
  const admin = createAdminClient();

  // Verificar se é admin
  const { data: profile } = await admin
    .from('app_users')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role === 'admin') return; // admin pode tudo

  // Se não é admin, verificar ownership
  const { data: demand } = await admin
    .from('demands')
    .select('created_by')
    .eq('id', demandaId)
    .single();

  if (!demand) throw new Error('Demanda não encontrada');
  if (demand.created_by !== userId) throw new Error('Sem permissão para modificar esta demanda');
}

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

export async function updateDemanda(id: number, data: Partial<DemandaInput>) {
  const userId = await currentUserId();
  await requireOwnershipOrAdmin(id, userId);
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('demands')
    .update(data)
    .eq('id', id)
    .select('*, assignee:assigned_to(name)')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/demandas');
  return row;
}

export async function deleteDemanda(id: number) {
  // FIX F3 (ALTO): Verificar ownership/admin antes de permitir delete
  const userId = await currentUserId();
  await requireOwnershipOrAdmin(id, userId);
  const admin = createAdminClient();
  const { error } = await admin.from('demands').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/demandas');
}

export async function createDemandaAndReturn(data: DemandaInput) {
  const userId = await currentUserId();
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('demands')
    .insert({ ...data, created_by: userId })
    .select('*, assignee:assigned_to(name)')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/demandas');
  return row;
}

export async function updateDemandaStatus(id: number, status: string) {
  await updateDemanda(id, { status });
}
