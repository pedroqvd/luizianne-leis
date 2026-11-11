export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireTabAccess } from '@/lib/auth-guard';
import { ArticulacaoClient } from './ArticulacaoClient';

export default async function ArticulacaoPage() {
  await requireTabAccess('articulacao');

  const admin = createAdminClient();

  const [
    { data: municipalities },
    { data: authorities },
    { data: demands },
    { data: trackings },
    { data: amendments },
    { data: members },
  ] = await Promise.all([
    admin
      .from('ceara_municipalities')
      .select('id, ibge_code, name, macro_region, population')
      .order('name'),
    admin
      .from('municipal_authorities')
      .select('*')
      .eq('active', true)
      .order('municipality_name', { ascending: true }),
    admin
      .from('authority_demands')
      .select('*, assignee:assigned_to(name)')
      .order('created_at', { ascending: false })
      .limit(1000),
    admin
      .from('edital_authority_tracking')
      .select(
        `*,
         edital:edital_id(id, titulo, orgao, ministerio, valor_estimado, data_proposta_fim, situacao, categoria_tematica, url_fonte, url_edital, modalidade, uf, municipio),
         demand:demand_id(id, title, category, urgency, estimated_value)`,
      )
      .order('match_score', { ascending: false })
      .limit(1000),
    admin
      .from('emendas_orcamentarias')
      .select(
        'id, codigo_emenda, ano, municipio, funcao, descricao_funcao, subfuncao, descricao_subfuncao, descricao, valor_empenhado, valor_pago',
      )
      .order('ano', { ascending: false })
      .limit(500),
    admin.from('app_users').select('id, name, email').order('name'),
  ]);

  const munByIbge = new Map((municipalities ?? []).map((m: any) => [m.ibge_code, m]));
  const munById = new Map((municipalities ?? []).map((m: any) => [m.id, m]));
  const munByName = new Map((municipalities ?? []).map((m: any) => [m.name?.toLowerCase?.(), m]));

  const mappedAuthorities = (authorities ?? []).map((a: any) => {
    const mun = (a.municipality_ibge ? munByIbge.get(a.municipality_ibge) : null)
      ?? (a.municipality_id ? munById.get(a.municipality_id) : null)
      ?? (a.municipality_name ? munByName.get(a.municipality_name.toLowerCase()) : null)
      ?? a.municipality
      ?? {
        id: a.municipality_id ?? 0,
        ibge_code: a.municipality_ibge ?? '',
        name: a.municipality_name ?? 'Município',
        macro_region: a.macro_region ?? 'Interior',
        population: null,
      };

    return {
      ...a,
      municipality: mun,
      municipality_id: a.municipality_id ?? mun?.id ?? 0,
      role: a.role ?? a.role_type ?? 'prefeito',
      whatsapp: a.whatsapp ?? a.phone_whatsapp ?? a.phone ?? null,
      phone: a.phone ?? a.phone_whatsapp ?? null,
    };
  });

  const mappedAmendments = (amendments ?? []).map((a: any) => ({
    id: Number(a.id),
    code: a.codigo_emenda ?? String(a.id),
    year: Number(a.ano ?? new Date().getFullYear()),
    locality: a.municipio ?? null,
    function_name: a.descricao_funcao ?? a.funcao ?? null,
    subfunction_name: a.descricao_subfuncao ?? a.subfuncao ?? null,
    action_name: a.descricao ?? null,
    value_empenhado: Number(a.valor_empenhado ?? 0),
    value_pago: Number(a.valor_pago ?? 0),
  }));

  return (
    <ArticulacaoClient
      municipalities={municipalities ?? []}
      initialAuthorities={mappedAuthorities}
      initialDemands={demands ?? []}
      initialTrackings={trackings ?? []}
      amendments={mappedAmendments}
      members={members ?? []}
    />
  );
}
