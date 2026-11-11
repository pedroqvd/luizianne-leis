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
      .from('budget_amendments')
      .select(
        'id, code, year, locality, function_name, subfunction_name, action_name, value_empenhado, value_pago',
      )
      .order('year', { ascending: false })
      .limit(500),
    admin.from('app_users').select('id, name, email').order('name'),
  ]);

  return (
    <ArticulacaoClient
      municipalities={municipalities ?? []}
      initialAuthorities={authorities ?? []}
      initialDemands={demands ?? []}
      initialTrackings={trackings ?? []}
      amendments={amendments ?? []}
      members={members ?? []}
    />
  );
}
