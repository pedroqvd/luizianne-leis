export const ALL_TAB_SLUGS = [
  'articulacao',
  'editais',
  'emendas',
  'demandas',
  'legislativo',
  'votes',
  'comissoes',
  'analytics',
  'atividade',
  'despesas',
  'discursos',
  'frentes',
  'presenca',
] as const;

export type TabSlug = (typeof ALL_TAB_SLUGS)[number];

export interface TabDefinition {
  slug: TabSlug;
  label: string;
  shortLabel?: string;
  href: string;
}

export const ALL_TABS: TabDefinition[] = [
  { slug: 'articulacao', label: 'Articulação Municipal', shortLabel: 'Prefeitos', href: '/articulacao' },
  { slug: 'editais',     label: 'Editais & Radar',       shortLabel: 'Editais',   href: '/editais' },
  { slug: 'emendas',     label: 'Emendas',               shortLabel: 'Emendas',   href: '/emendas' },
  { slug: 'demandas',    label: 'Demandas Gerais',       shortLabel: 'Demandas',  href: '/demandas' },
  { slug: 'legislativo', label: 'Legislativo',           shortLabel: 'Legisl.',   href: '/legislativo' },
  { slug: 'votes',       label: 'Votações',              shortLabel: 'Votações',  href: '/votes' },
  { slug: 'comissoes',   label: 'Comissões',             shortLabel: 'Comissões', href: '/comissoes' },
  { slug: 'analytics',   label: 'Analytics',             shortLabel: 'Analytics', href: '/analytics' },
  { slug: 'atividade',   label: 'Atividade',             shortLabel: 'Atividade', href: '/atividade' },
  { slug: 'despesas',    label: 'CEAP',                  shortLabel: 'CEAP',      href: '/despesas' },
  { slug: 'discursos',   label: 'Discursos',             shortLabel: 'Discursos', href: '/discursos' },
  { slug: 'frentes',     label: 'Frentes Parl.',         shortLabel: 'Frentes',   href: '/frentes' },
  { slug: 'presenca',    label: 'Presença',              shortLabel: 'Presença',  href: '/presenca' },
];
