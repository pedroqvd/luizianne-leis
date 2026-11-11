'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireTabAccess, logSecurityAudit } from '@/lib/auth-guard';
import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export const ALLOWED_AUTHORITY_ROLES = [
  'prefeito',
  'vice_prefeito',
  'secretario_municipal',
  'lideranca_local',
  'vereador_aliado',
] as const;

export const ALLOWED_ALLIED_STATUSES = [
  'aliado_base_elmano',
  'parceiro_estrategico',
  'em_articulacao',
  'institucional',
] as const;

export const ALLOWED_DEMAND_CATEGORIES = [
  'saúde',
  'educação',
  'infraestrutura',
  'recursos hídricos',
  'agricultura',
  'assistência social',
  'habitação',
  'cultura e esporte',
  'meio ambiente',
  'segurança pública',
  'desenvolvimento regional',
] as const;

export const ALLOWED_DEMAND_STATUSES = [
  'mapeada',
  'em_analise',
  'vinculada_edital',
  'emenda_alocada',
  'em_execucao',
  'atendida',
  'arquivada',
] as const;

export const ALLOWED_DEMAND_URGENCIES = ['baixa', 'media', 'alta', 'critica'] as const;

export const ALLOWED_TRACKING_STATUSES = [
  'sugerido',
  'em_avaliacao',
  'prefeito_notificado',
  'elaborando_projeto',
  'proposta_enviada',
  'contemplado',
  'descartado',
] as const;

export interface AuthorityInput {
  id?: string;
  municipality_id: number;
  name: string;
  role: string;
  party?: string | null;
  allied_status: string;
  mayor_mandate?: string | null;
  senator_votes?: number | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  cabinet_chief_name?: string | null;
  cabinet_chief_contact?: string | null;
  priority_areas?: string[];
  last_meeting_at?: string | null;
  confidential_notes?: string | null;
}

export interface AuthorityDemandInput {
  id?: string;
  authority_id: string;
  municipality_id: number;
  title: string;
  description?: string | null;
  category: string;
  keywords?: string[];
  estimated_value?: number | null;
  urgency: string;
  status: string;
  target_ministry?: string | null;
  protocol_number?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  notes?: string | null;
}

export interface EditalTrackingInput {
  edital_id: number;
  authority_id: string;
  demand_id?: string | null;
  match_score?: number;
  match_reasons?: string[];
  tracking_status: string;
  protocol_submitted?: string | null;
  notes?: string | null;
}

export interface StrategicEditalInput {
  titulo: string;
  orgao: string;
  ministerio: string;
  numero?: string;
  objeto: string;
  modalidade?: string;
  uf?: string;
  municipio?: string;
  valor_estimado?: number | null;
  data_proposta_fim?: string | null;
  url_fonte?: string;
  url_edital?: string;
  categoria_tematica: string;
  keywords_extraidas?: string[];
  origem?: 'manual' | 'transferegov' | 'pac_selecoes';
}

function normalizeStr(s?: string | null): string {
  if (!s) return '';
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function extractKeywordsFromText(text: string): string[] {
  const stop = new Set([
    'para', 'como', 'mais', 'pela', 'pelo', 'este', 'esta', 'entre', 'sobre',
    'municipio', 'prefeitura', 'municipal', 'ceara', 'construcao', 'reforma',
    'aquisicao', 'implantacao', 'projeto', 'programa', 'bairro', 'distrito',
  ]);
  const tokens = normalizeStr(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !stop.has(t));
  return Array.from(new Set(tokens)).slice(0, 12);
}

/**
 * Executa o recálculo de matches via backend NestJS e, como fallback resiliente,
 * também executa diretamente via Supabase caso a API esteja em cold start.
 */
async function triggerMatchmakingRecompute(options?: {
  editalId?: number;
  authorityId?: string;
}): Promise<{ matchesUpserted: number }> {
  try {
    const res = await api<{ matchesUpserted: number }>('/editais/recompute-matches', {
      method: 'POST',
      body: JSON.stringify(options ?? {}),
    });
    if (res && typeof res.matchesUpserted === 'number') {
      return res;
    }
  } catch {
    // Fallback direto via Supabase Admin Client
  }

  const admin = createAdminClient();
  let editaisQuery = admin
    .from('editais')
    .select(
      'id, titulo, objeto, orgao, ministerio, uf, municipio, valor_estimado, categoria_tematica, keywords_extraidas, elegivel_prefeituras, abrangencia',
    )
    .eq('situacao', 'aberto')
    .limit(500);
  if (options?.editalId) {
    editaisQuery = editaisQuery.eq('id', options.editalId);
  }

  let authQuery = admin
    .from('municipal_authorities')
    .select('id, name, role, priority_areas, municipality:municipality_id(name, macro_region)')
    .eq('active', true);
  if (options?.authorityId) {
    authQuery = authQuery.eq('id', options.authorityId);
  }

  let demQuery = admin
    .from('authority_demands')
    .select(
      'id, authority_id, title, description, category, keywords, estimated_value, urgency, target_ministry',
    )
    .not('status', 'in', '("atendida","arquivada")');
  if (options?.authorityId) {
    demQuery = demQuery.eq('authority_id', options.authorityId);
  }

  const [{ data: editais }, { data: authorities }, { data: demands }] = await Promise.all([
    editaisQuery,
    authQuery,
    demQuery,
  ]);

  if (!editais?.length || !authorities?.length) {
    return { matchesUpserted: 0 };
  }

  const demandsByAuth = new Map<string, any[]>();
  for (const d of demands ?? []) {
    const list = demandsByAuth.get(d.authority_id) ?? [];
    list.push(d);
    demandsByAuth.set(d.authority_id, list);
  }

  const upserts: any[] = [];

  for (const edital of editais) {
    const edCorpus = normalizeStr(
      [
        edital.titulo,
        edital.objeto ?? '',
        edital.orgao,
        edital.ministerio,
        ...(edital.keywords_extraidas ?? []),
      ].join(' '),
    );
    const edCat = normalizeStr(edital.categoria_tematica);
    const edOrg = normalizeStr(`${edital.ministerio} ${edital.orgao}`);

    for (const auth of authorities as any[]) {
      const authDemands = demandsByAuth.get(auth.id) ?? [];
      const authPrio = (auth.priority_areas ?? []).map(normalizeStr);
      const munName = Array.isArray(auth.municipality)
        ? auth.municipality[0]?.name
        : auth.municipality?.name;

      let bestScore = 0;
      let bestReasons: string[] = [];
      let bestDemandId: string | null = null;

      for (const dem of authDemands) {
        let score = 0;
        const reasons: string[] = [];
        const demCat = normalizeStr(dem.category);

        if (demCat && edCat && demCat === edCat) {
          score += 35;
          reasons.push(`Mesma área temática da demanda (${dem.category})`);
        } else if (edCat && authPrio.includes(edCat)) {
          score += 20;
          reasons.push(`Área prioritária do município (${edital.categoria_tematica})`);
        }

        const demTokens = new Set([
          ...extractKeywordsFromText(`${dem.title} ${dem.description ?? ''}`),
          ...(dem.keywords ?? []).map(normalizeStr).filter((k: string) => k.length >= 3),
        ]);
        const matched: string[] = [];
        for (const tk of demTokens) {
          if (tk && edCorpus.includes(tk)) matched.push(tk);
        }
        if (matched.length > 0) {
          score += Math.min(30, matched.length * 9);
          reasons.push(`Termos compatíveis: ${matched.slice(0, 4).join(', ')}`);
        }

        const targetMin = normalizeStr(dem.target_ministry);
        if (targetMin && edOrg.includes(targetMin)) {
          score += 15;
          reasons.push(`Órgão concedente compatível (${edital.ministerio})`);
        }

        if (edital.uf === 'CE' && munName && normalizeStr(edital.municipio) === normalizeStr(munName)) {
          score += 10;
          reasons.push(`Execução direta em ${munName}/CE`);
        } else if (edital.uf === 'CE' || edital.abrangencia === 'CE') {
          score += 8;
          reasons.push(`Abrangência no estado do Ceará`);
        } else if (edital.elegivel_prefeituras) {
          score += 6;
          reasons.push(`Elegível para prefeituras / adesão municipal`);
        }

        if (dem.urgency === 'critica') {
          score += 6;
          reasons.push(`Demanda de urgência crítica`);
        } else if (dem.urgency === 'alta') {
          score += 4;
        }

        if (score > bestScore) {
          bestScore = Math.min(100, score);
          bestReasons = reasons;
          bestDemandId = dem.id;
        }
      }

      if (bestScore >= 40) {
        upserts.push({
          edital_id: edital.id,
          authority_id: auth.id,
          demand_id: bestDemandId,
          match_score: bestScore,
          match_reasons: bestReasons,
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  if (upserts.length > 0) {
    await admin.from('edital_authority_tracking').upsert(upserts, {
      onConflict: 'edital_id,authority_id',
      ignoreDuplicates: false,
    });
  }

  return { matchesUpserted: upserts.length };
}

export async function saveAuthority(input: AuthorityInput) {
  const { userId, email } = await requireTabAccess('articulacao', { isAction: true });

  const name = String(input.name ?? '').trim().slice(0, 200);
  if (!name) throw new Error('O nome da autoridade é obrigatório.');

  const municipalityId = Number(input.municipality_id);
  if (!Number.isInteger(municipalityId) || municipalityId <= 0) {
    throw new Error('Selecione um município válido do Ceará.');
  }

  const role = (ALLOWED_AUTHORITY_ROLES as readonly string[]).includes(input.role)
    ? input.role
    : 'prefeito';

  const alliedStatus = (ALLOWED_ALLIED_STATUSES as readonly string[]).includes(input.allied_status)
    ? input.allied_status
    : 'aliado_base_elmano';

  const priorityAreas = Array.isArray(input.priority_areas)
    ? input.priority_areas
        .map((a) => String(a).trim().toLowerCase())
        .filter((a) => (ALLOWED_DEMAND_CATEGORIES as readonly string[]).includes(a))
    : [];

  const payload: Record<string, any> = {
    municipality_id: municipalityId,
    name,
    role,
    party: input.party ? String(input.party).trim().toUpperCase().slice(0, 30) : null,
    allied_status: alliedStatus,
    mayor_mandate: input.mayor_mandate ? String(input.mayor_mandate).trim().slice(0, 50) : null,
    senator_votes:
      input.senator_votes != null && Number.isFinite(Number(input.senator_votes))
        ? Math.max(0, Math.floor(Number(input.senator_votes)))
        : null,
    phone: input.phone ? String(input.phone).trim().slice(0, 60) : null,
    whatsapp: input.whatsapp ? String(input.whatsapp).trim().slice(0, 60) : null,
    email: input.email ? String(input.email).trim().toLowerCase().slice(0, 150) : null,
    cabinet_chief_name: input.cabinet_chief_name
      ? String(input.cabinet_chief_name).trim().slice(0, 150)
      : null,
    cabinet_chief_contact: input.cabinet_chief_contact
      ? String(input.cabinet_chief_contact).trim().slice(0, 100)
      : null,
    priority_areas: priorityAreas,
    last_meeting_at: input.last_meeting_at ? String(input.last_meeting_at).slice(0, 10) : null,
    confidential_notes: input.confidential_notes
      ? String(input.confidential_notes).trim().slice(0, 8000)
      : null,
    updated_at: new Date().toISOString(),
  };

  const admin = createAdminClient();
  let saved: any;

  if (input.id) {
    const { data, error } = await admin
      .from('municipal_authorities')
      .update(payload)
      .eq('id', input.id)
      .select('*, municipality:municipality_id(id, name, macro_region, population)')
      .single();
    if (error) throw new Error(error.message);
    saved = data;

    await logSecurityAudit({
      actorId: userId,
      actorEmail: email,
      action: 'AUTHORITY_UPDATE',
      resourceType: 'municipal_authorities',
      resourceId: saved.id,
      metadata: { name, municipalityId, role },
    });
  } else {
    const { data, error } = await admin
      .from('municipal_authorities')
      .insert({ ...payload, created_by: userId })
      .select('*, municipality:municipality_id(id, name, macro_region, population)')
      .single();
    if (error) throw new Error(error.message);
    saved = data;

    await logSecurityAudit({
      actorId: userId,
      actorEmail: email,
      action: 'AUTHORITY_CREATE',
      resourceType: 'municipal_authorities',
      resourceId: saved.id,
      metadata: { name, municipalityId, role },
    });
  }

  await triggerMatchmakingRecompute({ authorityId: saved.id });
  revalidatePath('/articulacao');
  revalidatePath('/editais');
  return saved;
}

export async function deleteAuthority(id: string) {
  const { userId, email, isAdmin } = await requireTabAccess('articulacao', { isAction: true });
  const admin = createAdminClient();

  if (!isAdmin) {
    const { data: existing } = await admin
      .from('municipal_authorities')
      .select('created_by')
      .eq('id', id)
      .single();
    if (!existing) throw new Error('Autoridade não encontrada');
    if (existing.created_by !== userId) {
      throw new Error('Apenas administradores ou quem cadastrou pode excluir este perfil.');
    }
  }

  const { error } = await admin.from('municipal_authorities').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await logSecurityAudit({
    actorId: userId,
    actorEmail: email,
    action: 'AUTHORITY_DELETE',
    resourceType: 'municipal_authorities',
    resourceId: id,
  });

  revalidatePath('/articulacao');
  revalidatePath('/editais');
}

export async function saveAuthorityDemand(input: AuthorityDemandInput) {
  const { userId, email } = await requireTabAccess('articulacao', { isAction: true });

  const title = String(input.title ?? '').trim().slice(0, 300);
  if (!title) throw new Error('O título da demanda municipal é obrigatório.');

  const category = (ALLOWED_DEMAND_CATEGORIES as readonly string[]).includes(
    String(input.category ?? '').toLowerCase(),
  )
    ? String(input.category).toLowerCase()
    : 'infraestrutura';

  const urgency = (ALLOWED_DEMAND_URGENCIES as readonly string[]).includes(input.urgency)
    ? input.urgency
    : 'alta';

  const status = (ALLOWED_DEMAND_STATUSES as readonly string[]).includes(input.status)
    ? input.status
    : 'mapeada';

  const description = input.description ? String(input.description).trim().slice(0, 5000) : null;

  const explicitKeywords = Array.isArray(input.keywords)
    ? input.keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean)
    : [];
  const autoKeywords = extractKeywordsFromText(`${title} ${description ?? ''}`);
  const mergedKeywords = Array.from(new Set([...explicitKeywords, ...autoKeywords])).slice(0, 15);

  const payload: Record<string, any> = {
    authority_id: input.authority_id,
    municipality_id: Number(input.municipality_id),
    title,
    description,
    category,
    keywords: mergedKeywords,
    estimated_value:
      input.estimated_value != null && Number.isFinite(Number(input.estimated_value))
        ? Number(input.estimated_value)
        : null,
    urgency,
    status,
    target_ministry: input.target_ministry
      ? String(input.target_ministry).trim().slice(0, 180)
      : null,
    protocol_number: input.protocol_number
      ? String(input.protocol_number).trim().slice(0, 100)
      : null,
    assigned_to: input.assigned_to ? String(input.assigned_to).trim() : null,
    due_date: input.due_date ? String(input.due_date).slice(0, 10) : null,
    notes: input.notes ? String(input.notes).trim().slice(0, 5000) : null,
    updated_at: new Date().toISOString(),
  };

  const admin = createAdminClient();
  let saved: any;

  if (input.id) {
    const { data, error } = await admin
      .from('authority_demands')
      .update(payload)
      .eq('id', input.id)
      .select('*, assignee:assigned_to(name)')
      .single();
    if (error) throw new Error(error.message);
    saved = data;

    await logSecurityAudit({
      actorId: userId,
      actorEmail: email,
      action: 'AUTHORITY_DEMAND_UPDATE',
      resourceType: 'authority_demands',
      resourceId: saved.id,
      metadata: { title, category, status },
    });
  } else {
    const { data, error } = await admin
      .from('authority_demands')
      .insert({ ...payload, created_by: userId })
      .select('*, assignee:assigned_to(name)')
      .single();
    if (error) throw new Error(error.message);
    saved = data;

    await logSecurityAudit({
      actorId: userId,
      actorEmail: email,
      action: 'AUTHORITY_DEMAND_CREATE',
      resourceType: 'authority_demands',
      resourceId: saved.id,
      metadata: { title, category, authorityId: input.authority_id },
    });
  }

  await triggerMatchmakingRecompute({ authorityId: input.authority_id });
  revalidatePath('/articulacao');
  revalidatePath('/editais');
  return saved;
}

export async function updateAuthorityDemandStatus(id: string, status: string) {
  const { userId, email } = await requireTabAccess('articulacao', { isAction: true });
  if (!(ALLOWED_DEMAND_STATUSES as readonly string[]).includes(status)) {
    throw new Error('Status inválido');
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('authority_demands')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, assignee:assigned_to(name)')
    .single();
  if (error) throw new Error(error.message);

  await logSecurityAudit({
    actorId: userId,
    actorEmail: email,
    action: 'AUTHORITY_DEMAND_STATUS',
    resourceType: 'authority_demands',
    resourceId: id,
    metadata: { status },
  });

  revalidatePath('/articulacao');
  return data;
}

export async function deleteAuthorityDemand(id: string) {
  const { userId, email, isAdmin } = await requireTabAccess('articulacao', { isAction: true });
  const admin = createAdminClient();

  if (!isAdmin) {
    const { data: row } = await admin
      .from('authority_demands')
      .select('created_by')
      .eq('id', id)
      .single();
    if (!row) throw new Error('Demanda não encontrada');
    if (row.created_by !== userId) {
      throw new Error('Sem permissão para excluir esta demanda.');
    }
  }

  const { error } = await admin.from('authority_demands').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await logSecurityAudit({
    actorId: userId,
    actorEmail: email,
    action: 'AUTHORITY_DEMAND_DELETE',
    resourceType: 'authority_demands',
    resourceId: id,
  });

  revalidatePath('/articulacao');
  revalidatePath('/editais');
}

export async function upsertEditalTracking(input: EditalTrackingInput) {
  const { userId, email } = await requireTabAccess('editais', { isAction: true });

  if (!(ALLOWED_TRACKING_STATUSES as readonly string[]).includes(input.tracking_status)) {
    throw new Error('Status de traqueamento inválido.');
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const payload: Record<string, any> = {
    edital_id: Number(input.edital_id),
    authority_id: input.authority_id,
    tracking_status: input.tracking_status,
    updated_at: nowIso,
  };

  if (input.demand_id !== undefined) payload.demand_id = input.demand_id;
  if (input.match_score !== undefined) payload.match_score = input.match_score;
  if (input.match_reasons !== undefined) payload.match_reasons = input.match_reasons;
  if (input.protocol_submitted !== undefined) {
    payload.protocol_submitted = input.protocol_submitted
      ? String(input.protocol_submitted).trim().slice(0, 120)
      : null;
  }
  if (input.notes !== undefined) {
    payload.notes = input.notes ? String(input.notes).trim().slice(0, 4000) : null;
  }
  if (input.tracking_status === 'prefeito_notificado') {
    payload.notified_at = nowIso;
    payload.notified_by = userId;
  }

  const { data: row, error } = await admin
    .from('edital_authority_tracking')
    .upsert(payload, { onConflict: 'edital_id,authority_id' })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  // Se houver demanda vinculada e o prefeito avançou para elaboração/envio, atualiza status da demanda
  const linkedDemandId = input.demand_id ?? row?.demand_id;
  if (
    linkedDemandId &&
    ['elaborando_projeto', 'proposta_enviada', 'contemplado'].includes(input.tracking_status)
  ) {
    const nextDemandStatus =
      input.tracking_status === 'contemplado' ? 'em_execucao' : 'vinculada_edital';
    await admin
      .from('authority_demands')
      .update({ status: nextDemandStatus, updated_at: nowIso })
      .eq('id', linkedDemandId)
      .in('status', ['mapeada', 'em_analise', 'vinculada_edital']);
  }

  await logSecurityAudit({
    actorId: userId,
    actorEmail: email,
    action: 'EDITAL_TRACKING_UPSERT',
    resourceType: 'edital_authority_tracking',
    resourceId: `${input.edital_id}:${input.authority_id}`,
    metadata: { tracking_status: input.tracking_status },
  });

  revalidatePath('/articulacao');
  revalidatePath('/editais');
  revalidatePath(`/editais/${input.edital_id}`);
  return row;
}

export async function recomputeEditalMatchesAction(options?: {
  editalId?: number;
  authorityId?: string;
}) {
  await requireTabAccess('editais', { isAction: true });
  const res = await triggerMatchmakingRecompute(options);
  revalidatePath('/articulacao');
  revalidatePath('/editais');
  if (options?.editalId) {
    revalidatePath(`/editais/${options.editalId}`);
  }
  return res;
}

export async function createStrategicEdital(input: StrategicEditalInput) {
  const { userId, email } = await requireTabAccess('editais', { isAction: true });

  const titulo = String(input.titulo ?? '').trim().slice(0, 250);
  const orgao = String(input.orgao ?? '').trim().slice(0, 200);
  const ministerio = String(input.ministerio ?? orgao).trim().slice(0, 200);
  const objeto = String(input.objeto ?? titulo).trim().slice(0, 5000);

  if (!titulo || !orgao) {
    throw new Error('Título e Órgão/Ministério são obrigatórios.');
  }

  const categoria = (ALLOWED_DEMAND_CATEGORIES as readonly string[]).includes(
    String(input.categoria_tematica ?? '').toLowerCase(),
  )
    ? String(input.categoria_tematica).toLowerCase()
    : 'infraestrutura';

  const keywords =
    input.keywords_extraidas && input.keywords_extraidas.length > 0
      ? input.keywords_extraidas
      : extractKeywordsFromText(`${titulo} ${objeto}`);

  const pncpSyntheticId = `ESTRATEGICO-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const today = new Date().toISOString().slice(0, 10);

  const admin = createAdminClient();
  const { data: created, error } = await admin
    .from('editais')
    .insert({
      pncp_id: pncpSyntheticId,
      titulo,
      orgao,
      ministerio,
      orgao_superior: ministerio,
      numero: input.numero ? String(input.numero).trim().slice(0, 60) : 'CHAMAMENTO/PAC',
      objeto,
      modalidade: input.modalidade ? String(input.modalidade).trim().slice(0, 80) : 'Chamamento / Seleção Federal',
      esfera: 'Federal',
      poder: 'Executivo',
      uf: input.uf ? String(input.uf).trim().toUpperCase().slice(0, 2) : 'CE',
      municipio: input.municipio ? String(input.municipio).trim().slice(0, 120) : null,
      valor_estimado:
        input.valor_estimado != null && Number.isFinite(Number(input.valor_estimado))
          ? Number(input.valor_estimado)
          : null,
      data_publicacao: today,
      data_abertura: today,
      data_encerramento: input.data_proposta_fim ? String(input.data_proposta_fim).slice(0, 10) : null,
      data_proposta_inicio: new Date().toISOString(),
      data_proposta_fim: input.data_proposta_fim
        ? new Date(String(input.data_proposta_fim) + 'T23:59:59Z').toISOString()
        : null,
      situacao: 'aberto',
      url_fonte: input.url_fonte ? String(input.url_fonte).trim() : null,
      url_edital: input.url_edital ? String(input.url_edital).trim() : null,
      categoria_tematica: categoria,
      keywords_extraidas: keywords,
      publico_alvo: ['prefeituras', 'consorcios_publicos'],
      elegivel_prefeituras: true,
      abrangencia: input.uf === 'CE' ? 'CE' : 'Nacional',
      origem: input.origem ?? 'transferegov',
      payload: { created_by: userId, manual: true },
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  await logSecurityAudit({
    actorId: userId,
    actorEmail: email,
    action: 'STRATEGIC_EDITAL_CREATE',
    resourceType: 'editais',
    resourceId: created.id,
    metadata: { titulo, ministerio, categoria },
  });

  await triggerMatchmakingRecompute({ editalId: created.id });
  revalidatePath('/editais');
  revalidatePath('/articulacao');
  return created;
}
