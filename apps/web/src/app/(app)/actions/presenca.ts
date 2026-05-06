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
  const { error } = await admin.from('presence_records').insert({
    ...data,
    created_by: userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/presenca');
}

export async function deletePresenceRecord(id: number) {
  await currentUserId();
  const admin = createAdminClient();
  const { error } = await admin.from('presence_records').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/presenca');
}
