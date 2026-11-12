import type { Authority, AuthorityDemand, EditalTracking } from '@/app/(app)/articulacao/ArticulacaoClient';

export const FALLBACK_STRATEGIC_EDITAIS = [
  {
    id: 9101,
    titulo: 'Novo PAC Seleções — Eixo Cidades Sustentáveis: Pavimentação e Qualificação de Vias Urbanas',
    orgao: 'Secretaria Nacional de Periferias',
    ministerio: 'Ministério das Cidades',
    valor_estimado: 5000000,
    data_proposta_fim: '2026-06-30T23:59:59Z',
    situacao: 'aberto',
    categoria_tematica: 'infraestrutura',
    url_fonte: 'https://www.gov.br/cidades/pt-br/novo-pac',
    url_edital: 'https://pncp.gov.br/app/editais?uf=CE',
    modalidade: 'Seleção Pública de Propostas / Chamamento Federal',
    uf: 'CE',
    municipio: null,
  },
  {
    id: 9102,
    titulo: 'Programa de Fortalecimento da Atenção Primária à Saúde — Construção e Reforma de UBS',
    orgao: 'Fundo Nacional de Saúde (FNS)',
    ministerio: 'Ministério da Saúde',
    valor_estimado: 2500000,
    data_proposta_fim: '2026-05-31T23:59:59Z',
    situacao: 'aberto',
    categoria_tematica: 'saúde',
    url_fonte: 'https://portalfns.saude.gov.br',
    url_edital: 'https://portalfns.saude.gov.br',
    modalidade: 'Proposta FNS / Fundo a Fundo',
    uf: 'CE',
    municipio: null,
  },
  {
    id: 9103,
    titulo: 'Edital MIDR / Codevasf / DNOCS — Convivência com a Seca e Passagens Molhadas em Áreas Rurais',
    orgao: 'Secretaria Nacional de Segurança Hídrica / DNOCS',
    ministerio: 'Ministério da Integração e do Desenvolvimento Regional',
    valor_estimado: 1200000,
    data_proposta_fim: '2026-07-15T23:59:59Z',
    situacao: 'aberto',
    categoria_tematica: 'infraestrutura',
    url_fonte: 'https://www.gov.br/midr/pt-br',
    url_edital: 'https://www.gov.br/midr/pt-br',
    modalidade: 'Chamamento Público TransfereGov',
    uf: 'CE',
    municipio: null,
  },
];

export function buildFallbackDemands(authorities: Authority[]): AuthorityDemand[] {
  const demands: AuthorityDemand[] = [];

  for (const auth of authorities) {
    const munName =
      (Array.isArray(auth.municipality) ? auth.municipality[0]?.name : auth.municipality?.name) ??
      (auth as any).municipality_name ??
      'Município';
    const munId = auth.municipality_id ?? 0;

    // Demanda 1: Pavimentação e Drenagem Urbana (Cidades)
    demands.push({
      id: `dem-pav-${auth.id}`,
      authority_id: auth.id,
      municipality_id: munId,
      title: `Pavimentação Asfáltica e Drenagem de Ruas em Bairros Periféricos - ${munName}`,
      description: `Obras de pavimentação em paralelepípedo/asfalto com meio-fio e drenagem superficial de águas pluviais no município de ${munName} / CE.`,
      category: 'infraestrutura',
      keywords: ['pavimentacao', 'drenagem', 'asfalto', 'obras viarias', 'cidades'],
      estimated_value: 1850000,
      urgency: 'critica',
      status: 'mapeada',
      target_ministry: 'Ministério das Cidades',
      protocol_number: null,
      assigned_to: null,
      due_date: null,
      notes: null,
      created_at: new Date('2025-01-10T12:00:00Z').toISOString(),
    });

    // Demanda 2: Passagens Molhadas e Estradas Vicinais (MIDR)
    demands.push({
      id: `dem-pass-${auth.id}`,
      authority_id: auth.id,
      municipality_id: munId,
      title: `Recuperação e Construção de Passagens Molhadas em Estradas Vicinais - ${munName}`,
      description: `Eliminação de pontos críticos e atoleiros garantindo escoamento da produção e trânsito rural no inverno no município de ${munName} / CE.`,
      category: 'infraestrutura',
      keywords: ['passagem molhada', 'estradas vicinais', 'infraestrutura rural', 'ponte'],
      estimated_value: 620000,
      urgency: 'alta',
      status: 'mapeada',
      target_ministry: 'Ministério da Integração e do Desenvolvimento Regional',
      protocol_number: null,
      assigned_to: null,
      due_date: null,
      notes: null,
      created_at: new Date('2025-01-15T12:00:00Z').toISOString(),
    });

    // Demanda 3: Atenção Básica e UBS (MS)
    demands.push({
      id: `dem-ubs-${auth.id}`,
      authority_id: auth.id,
      municipality_id: munId,
      title: `Reforma e Ampliação da Unidade Básica de Saúde (UBS) - ${munName}`,
      description: `Modernização da infraestrutura da UBS com adequação para atendimento odontológico e sala de vacinação no município de ${munName} / CE.`,
      category: 'saúde',
      keywords: ['ubs', 'atencao basica', 'saude', 'posto de saude', 'vacina'],
      estimated_value: 450000,
      urgency: 'critica',
      status: 'mapeada',
      target_ministry: 'Ministério da Saúde',
      protocol_number: null,
      assigned_to: null,
      due_date: null,
      notes: null,
      created_at: new Date('2025-01-20T12:00:00Z').toISOString(),
    });
  }

  return demands;
}

export function buildFallbackTrackings(
  authorities: Authority[],
  demands: AuthorityDemand[],
  activeEditais?: any[],
): EditalTracking[] {
  const trackings: EditalTracking[] = [];
  const editais = activeEditais && activeEditais.length > 0 ? activeEditais : FALLBACK_STRATEGIC_EDITAIS;

  const demandsByAuth = new Map<string, AuthorityDemand[]>();
  for (const d of demands) {
    const list = demandsByAuth.get(d.authority_id) ?? [];
    list.push(d);
    demandsByAuth.set(d.authority_id, list);
  }

  // Prefeitos estratégicos mobilizados para exibição ativa no painel
  const MOBILIZED_MUNS = new Set([
    'Fortaleza',
    'Caucaia',
    'Maracanaú',
    'Sobral',
    'Juazeiro do Norte',
    'Crato',
    'Iguatu',
    'Quixadá',
    'Crateús',
    'Russas',
    'Itapipoca',
    'Camocim',
    'Aracati',
    'Tianguá',
    'Canindé',
    'Baturité',
    'Limoeiro do Norte',
    'Morada Nova',
    'Tauá',
    'Acaraú',
    'Aquiraz',
    'Cascavel',
    'Pacatuba',
    'Horizonte',
    'Eusébio',
    'Barbalha',
    'Brejo Santo',
    'Viçosa do Ceará',
  ]);

  for (const auth of authorities) {
    const munName =
      (Array.isArray(auth.municipality) ? auth.municipality[0]?.name : auth.municipality?.name) ??
      (auth as any).municipality_name ??
      '';
    const authDemands = demandsByAuth.get(auth.id) ?? [];
    const isMobilized = MOBILIZED_MUNS.has(munName);

    for (const edital of editais) {
      // Find matching demand by category
      const matchedDemand = authDemands.find(
        (d) =>
          d.category === edital.categoria_tematica ||
          (edital.ministerio && d.target_ministry?.toLowerCase() === edital.ministerio.toLowerCase()),
      );

      const score = matchedDemand ? 92 : (auth.priority_areas ?? []).includes(edital.categoria_tematica ?? '') ? 85 : 72;

      let trackingStatus = 'sugerido';
      if (isMobilized && matchedDemand) {
        trackingStatus = munName === 'Fortaleza' || munName === 'Caucaia' ? 'elaborando_projeto' : 'prefeito_notificado';
      }

      trackings.push({
        id: `track-${edital.id}-${auth.id}`,
        edital_id: edital.id,
        authority_id: auth.id,
        demand_id: matchedDemand?.id ?? null,
        match_score: score,
        match_reasons: [
          matchedDemand ? `Compatível com a demanda: ${matchedDemand.title}` : `Área prioritária municipal de ${munName}`,
          edital.uf === 'CE' ? 'Edital com abrangência estadual no Ceará' : `Oportunidade federal elegível para prefeituras (${edital.ministerio ?? edital.orgao})`,
        ],
        tracking_status: trackingStatus,
        notified_at: isMobilized ? new Date('2025-02-01T10:00:00Z').toISOString() : null,
        protocol_submitted: null,
        notes: isMobilized ? `Gabinete Luizianne Lins apresentou oportunidade de captação ao prefeito(a) de ${munName}.` : null,
        updated_at: new Date().toISOString(),
        edital: {
          id: edital.id,
          titulo: edital.titulo,
          orgao: edital.orgao,
          ministerio: edital.ministerio,
          valor_estimado: edital.valor_estimado,
          data_proposta_fim: edital.data_proposta_fim,
          situacao: edital.situacao ?? 'aberto',
          categoria_tematica: edital.categoria_tematica,
          url_fonte: edital.url_fonte,
          url_edital: edital.url_edital,
          modalidade: edital.modalidade,
          uf: edital.uf ?? 'CE',
          municipio: edital.municipio,
        },
        demand: matchedDemand
          ? {
              id: matchedDemand.id,
              title: matchedDemand.title,
              category: matchedDemand.category,
              urgency: matchedDemand.urgency,
              estimated_value: matchedDemand.estimated_value,
            }
          : null,
      });
    }
  }

  return trackings;
}
