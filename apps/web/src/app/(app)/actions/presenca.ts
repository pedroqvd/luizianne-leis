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

const ALLOWED_MIMES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export async function uploadPresencePhoto(formData: FormData): Promise<string> {
  await requireTabAccess('presenca', { isAction: true });

  const file = formData.get('photo') as File | null;
  if (!file) throw new Error('Nenhum arquivo enviado');

  const safeExt = ALLOWED_MIMES[file.type];
  if (!safeExt) {
    throw new Error('Formato de imagem inválido. Use JPG, PNG ou WEBP.');
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error('A imagem deve ter no máximo 5 MB.');
  }

  const admin = createAdminClient();
  await admin.storage
    .createBucket('presence-photos', { public: true, fileSizeLimit: MAX_PHOTO_BYTES })
    .catch(() => undefined);

  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from('presence-photos')
    .upload(path, bytes, { upsert: false, contentType: file.type });

  if (uploadError) {
    throw new Error(`Erro ao enviar foto: ${uploadError.message}`);
  }

  const { data } = admin.storage.from('presence-photos').getPublicUrl(path);
  return data.publicUrl;
}

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
