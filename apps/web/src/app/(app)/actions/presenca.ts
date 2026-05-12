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

export async function createPresenceRecord(data: {
  location: 'brasilia' | 'fortaleza';
  date: string;
  type: string;
  notes?: string;
  photo_url?: string;
}) {
  const userId = await currentUserId();
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('presence_records')
    .insert({ ...data, created_by: userId })
    .select('*, creator:created_by(name)')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/presenca');
  return row;
}

export async function deletePresenceRecord(id: number) {
  const userId = await currentUserId();
  const admin = createAdminClient();

  const { data: profile } = await admin.from('app_users').select('role').eq('id', userId).single();
  if (profile?.role !== 'admin') {
    const { data: record } = await admin.from('presence_records').select('created_by').eq('id', id).single();
    if (!record) throw new Error('Registro não encontrado');
    if (record.created_by !== userId) throw new Error('Sem permissão para remover este registro');
  }

  const { error } = await admin.from('presence_records').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/presenca');
}
