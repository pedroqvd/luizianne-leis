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

export async function createDemanda(data: DemandaInput) {
  const userId = await currentUserId();
  const admin = createAdminClient();
  const { error } = await admin.from('demands').insert({ ...data, created_by: userId });
  if (error) throw new Error(error.message);
  revalidatePath('/demandas');
}

export async function updateDemanda(id: number, data: Partial<DemandaInput>) {
  await currentUserId();
  const admin = createAdminClient();
  const { error } = await admin.from('demands').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/demandas');
}

export async function deleteDemanda(id: number) {
  await currentUserId();
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
