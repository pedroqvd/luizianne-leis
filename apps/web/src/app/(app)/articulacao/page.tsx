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
      .select('*, municipality:municipality_id(id, name, macro_region, population)')
      .eq('active', true)
      .order('created_at', { ascending: false }),
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
      initialAuthorities={authorities ?? []}
      initialDemands={demands ?? []}
      initialTrackings={trackings ?? []}
      amendments={mappedAmendments}
      members={members ?? []}
    />
  );
}
