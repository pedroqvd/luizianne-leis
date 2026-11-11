'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireTabAccess, logSecurityAudit } from '@/lib/auth-guard';
import { revalidatePath } from 'next/cache';

const ALLOWED_LOCATIONS = new Set(['brasilia', 'fortaleza']);
const ALLOWED_TYPES = new Set([
  'expediente',
  'reuniao',
  'evento',
  'audiencia',
  'sessao',
  'comissao',
  'outro',
]);

export async function createPresenceRecord(data: {
  location: 'brasilia' | 'fortaleza';
  date: string;
  type: string;
  notes?: string;
  photo_url?: string;
}) {
  const { userId, email } = await requireTabAccess('presenca', { isAction: true });

  if (!ALLOWED_LOCATIONS.has(data.location)) {
    throw new Error('Localidade inválida');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new Error('Data inválida');
  }
  const safeType = ALLOWED_TYPES.has(data.type) ? data.type : 'outro';
  const safeNotes = data.notes ? String(data.notes).trim().slice(0, 2000) : null;

  let safePhotoUrl: string | null = null;
  if (data.photo_url) {
    try {
      const parsed = new URL(data.photo_url);
      if (parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co')) {
        safePhotoUrl = data.photo_url;
      }
    } catch {
      throw new Error('URL de foto inválida');
    }
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('presence_records')
    .insert({
      location: data.location,
      date: data.date,
      type: safeType,
      notes: safeNotes,
      photo_url: safePhotoUrl,
      created_by: userId,
    })
    .select('*, creator:created_by(name)')
    .single();
  if (error) throw new Error(error.message);

  await logSecurityAudit({
    actorId: userId,
    actorEmail: email,
    action: 'PRESENCE_CREATE',
    resourceType: 'presence_records',
    resourceId: row.id,
    metadata: { location: data.location, date: data.date, type: safeType },
  });

  revalidatePath('/presenca');
  return row;
}

export async function deletePresenceRecord(id: number) {
  const { userId, email, isAdmin } = await requireTabAccess('presenca', { isAction: true });
  const admin = createAdminClient();

  if (!isAdmin) {
    const { data: record } = await admin
      .from('presence_records')
      .select('created_by')
      .eq('id', id)
      .single();
    if (!record) throw new Error('Registro não encontrado');
    if (record.created_by !== userId) throw new Error('Sem permissão para remover este registro');
  }

  const { error } = await admin.from('presence_records').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await logSecurityAudit({
    actorId: userId,
    actorEmail: email,
    action: 'PRESENCE_DELETE',
    resourceType: 'presence_records',
    resourceId: id,
  });

  revalidatePath('/presenca');
}
