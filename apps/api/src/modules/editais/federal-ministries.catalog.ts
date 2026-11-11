/**
 * Catálogo Canônico dos 30+ Ministérios e mais de 60 Autarquias, Fundações
 * e Empresas Públicas do Governo Federal Brasileiro.
 * Utilizado para mapeamento, classificação e monitoramento contínuo de editais ativos.
 */

export interface AutarquiaDef {
  sigla: string;
  nome: string;
  keywords: string[];
}

export interface MinisterioDef {
  slug: string;
  sigla: string;
  nome: string;
  keywords: string[];
  autarquias: AutarquiaDef[];
}

export const FEDERAL_MINISTRIES_CATALOG: MinisterioDef[] = [
  {
    slug: 'saude',
    sigla: 'MS',
    nome: 'Ministério da Saúde',
    keywords: [
      'ministerio da saude', 'fundo nacional de saude', 'fns', 'gabinete do ministro da saude',
      'secretaria de atencao primaria a saude', 'secretaria de atencao especializada a saude',
      'secretaria de saude indigena', 'sesai',
    ],
    autarquias: [
      {
        sigla: 'FIOCRUZ',
        nome: 'Fundação Oswaldo Cruz',
        keywords: ['fundacao oswaldo cruz', 'fiocruz', 'bio-manguinhos', 'instituto oswaldo cruz'],
      },
      {
        sigla: 'FUNASA',
        nome: 'Fundação Nacional de Saúde',
        keywords: ['fundacao nacional de saude', 'funasa', 'superintendencia estadual da funasa'],
      },
      {
        sigla: 'ANVISA',
        nome: 'Agência Nacional de Vigilância Sanitária',
        keywords: ['agencia nacional de vigilancia sanitaria', 'anvisa'],
      },
      {
        sigla: 'ANS',
        nome: 'Agência Nacional de Saúde Suplementar',
        keywords: ['agencia nacional de saude suplementar', 'ans'],
      },
      {
        sigla: 'EBSERH',
        nome: 'Empresa Brasileira de Serviços Hospitalares',
        keywords: ['empresa brasileira de servicos hospitalares', 'ebserh', 'complexo hospitalar da ufc', 'maternidade-escola assis chateaubriand'],
      },
      {
        sigla: 'INCA',
        nome: 'Instituto Nacional de Câncer',
        keywords: ['instituto nacional de cancer', 'inca'],
      },
      {
        sigla: 'INTO',
        nome: 'Instituto Nacional de Traumatologia e Ortopedia',
        keywords: ['instituto nacional de traumatologia e ortopedia', 'into'],
      },
    ],
  },
  {
    slug: 'educacao',
    sigla: 'MEC',
    nome: 'Ministério da Educação',
    keywords: [
      'ministerio da educacao', 'mec', 'secretaria de educacao basica',
      'secretaria de educacao superior', 'secretaria de educacao profissional e tecnologica',
    ],
    autarquias: [
      {
        sigla: 'FNDE',
        nome: 'Fundo Nacional de Desenvolvimento da Educação',
        keywords: ['fundo nacional de desenvolvimento da educacao', 'fnde', 'caminho da escola', 'proinfancia'],
      },
      {
        sigla: 'CAPES',
        nome: 'Coordenação de Aperfeiçoamento de Pessoal de Nível Superior',
        keywords: ['coordenacao de aperfeicoamento de pessoal de nivel superior', 'capes'],
      },
      {
        sigla: 'INEP',
        nome: 'Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira',
        keywords: ['instituto nacional de estudos e pesquisas educacionais', 'inep'],
      },
      {
        sigla: 'UFC',
        nome: 'Universidade Federal do Ceará',
        keywords: ['universidade federal do ceara', 'ufc'],
      },
      {
        sigla: 'UFCA',
        nome: 'Universidade Federal do Cariri',
        keywords: ['universidade federal do cariri', 'ufca'],
      },
      {
        sigla: 'UNILAB',
        nome: 'Universidade da Integração Internacional da Lusofonia Afro-Brasileira',
        keywords: ['universidade da integracao internacional da lusofonia afro-brasileira', 'unilab'],
      },
      {
        sigla: 'IFCE',
        nome: 'Instituto Federal de Educação, Ciência e Tecnologia do Ceará',
        keywords: ['instituto federal de educacao, ciencia e tecnologia do ceara', 'instituto federal do ceara', 'ifce'],
      },
    ],
  },
  {
    slug: 'cidades',
    sigla: 'MCID',
    nome: 'Ministério das Cidades',
    keywords: [
      'ministerio das cidades', 'mcid', 'secretaria nacional de habitacao',
      'secretaria nacional de saneamento ambiental', 'secretaria nacional de mobilidade urbana',
      'secretaria nacional de periferias', 'minha casa minha vida',
    ],
    autarquias: [
      {
        sigla: 'CBTU',
        nome: 'Companhia Brasileira de Trens Urbanos',
        keywords: ['companhia brasileira de trens urbanos', 'cbtu'],
      },
      {
        sigla: 'TRENSURB',
        nome: 'Empresa de Trens Urbanos de Porto Alegre S.A.',
        keywords: ['empresa de trens urbanos de porto alegre', 'trensurb'],
      },
    ],
  },
  {
    slug: 'midr',
    sigla: 'MIDR',
    nome: 'Ministério da Integração e do Desenvolvimento Regional',
    keywords: [
      'ministerio da integracao e do desenvolvimento regional', 'midr', 'ministerio da integracao nacional',
      'secretaria nacional de protecao e defesa civil', 'secretaria nacional de fundos e instrumentos financeiros',
      'secretaria nacional de seguranca hidrica',
    ],
    autarquias: [
      {
        sigla: 'DNOCS',
        nome: 'Departamento Nacional de Obras Contra as Secas',
        keywords: ['departamento nacional de obras contra as secas', 'dnocs'],
      },
      {
        sigla: 'CODEVASF',
        nome: 'Companhia de Desenvolvimento dos Vales do São Francisco e do Parnaíba',
        keywords: ['companhia de desenvolvimento dos vales do sao francisco', 'codevasf'],
      },
      {
        sigla: 'SUDENE',
        nome: 'Superintendência do Desenvolvimento do Nordeste',
        keywords: ['superintendencia do desenvolvimento do nordeste', 'sudene'],
      },
      {
        sigla: 'SUDAM',
        nome: 'Superintendência do Desenvolvimento da Amazônia',
        keywords: ['superintendencia do desenvolvimento da amazonia', 'sudam'],
      },
    ],
  },
  {
    slug: 'mds',
    sigla: 'MDS',
    nome: 'Ministério do Desenvolvimento e Assistência Social, Família e Combate à Fome',
    keywords: [
      'ministerio do desenvolvimento e assistencia social', 'mds', 'ministerio do desenvolvimento social',
      'fundo nacional de assistencia social', 'fnas', 'secretaria nacional de assistencia social',
      'secretaria nacional de seguranca alimentar e nutricional',
    ],
    autarquias: [
      {
        sigla: 'INSS',
        nome: 'Instituto Nacional do Seguro Social',
        keywords: ['instituto nacional do seguro social', 'inss'],
      },
    ],
  },
  {
    slug: 'mapa',
    sigla: 'MAPA',
    nome: 'Ministério da Agricultura e Pecuária',
    keywords: [
      'ministerio da agricultura e pecuaria', 'mapa', 'ministerio da agricultura, pecuaria e abastecimento',
      'secretaria de defesa agropecuaria', 'secretaria de comercio e relacoes internacionais',
      'secretaria de inovacao, desenvolvimento sustentavel e irrigacao',
    ],
    autarquias: [
      {
        sigla: 'EMBRAPA',
        nome: 'Empresa Brasileira de Pesquisa Agropecuária',
        keywords: ['empresa brasileira de pesquisa agropecuaria', 'embrapa'],
      },
      {
        sigla: 'CONAB',
        nome: 'Companhia Nacional de Abastecimento',
        keywords: ['companhia nacional de abastecimento', 'conab'],
      },
    ],
  },
  {
    slug: 'mda',
    sigla: 'MDA',
    nome: 'Ministério do Desenvolvimento Agrário e Agricultura Familiar',
    keywords: [
      'ministerio do desenvolvimento agrario e agricultura familiar', 'mda', 'ministerio do desenvolvimento agrario',
      'secretaria de agricultura familiar e agroecologia', 'secretaria de governanca fundiaria',
    ],
    autarquias: [
      {
        sigla: 'INCRA',
        nome: 'Instituto Nacional de Colonização e Reforma Agrária',
        keywords: ['instituto nacional de colonizacao e reforma agraria', 'incra', 'superintendencia regional do incra'],
      },
    ],
  },
  {
    slug: 'mma',
    sigla: 'MMA',
    nome: 'Ministério do Meio Ambiente e Mudança do Clima',
    keywords: [
      'ministerio do meio ambiente e mudanca do clima', 'mma', 'ministerio do meio ambiente',
      'secretaria nacional de mudanca do clima', 'secretaria nacional de biodiversidade',
      'fundo nacional do meio ambiente', 'fundo clima',
    ],
    autarquias: [
      {
        sigla: 'IBAMA',
        nome: 'Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis',
        keywords: ['instituto brasileiro do meio ambiente e dos recursos naturais renovaveis', 'ibama'],
      },
      {
        sigla: 'ICMBio',
        nome: 'Instituto Chico Mendes de Conservação da Biodiversidade',
        keywords: ['instituto chico mendes de conservacao da biodiversidade', 'icmbio'],
      },
      {
        sigla: 'ANA',
        nome: 'Agência Nacional de Águas e Saneamento Básico',
        keywords: ['agencia nacional de aguas e saneamento basico', 'agencia nacional de aguas', 'ana'],
      },
      {
        sigla: 'JBRJ',
        nome: 'Instituto de Pesquisas Jardim Botânico do Rio de Janeiro',
        keywords: ['jardim botanico do rio de janeiro', 'jbrj'],
      },
    ],
  },
  {
    slug: 'minc',
    sigla: 'MinC',
    nome: 'Ministério da Cultura',
    keywords: [
      'ministerio da cultura', 'minc', 'secretaria dos comites de cultura',
      'secretaria de fomento e economia da cultura', 'lei paulo gustavo', 'politica nacional aldir blanc',
    ],
    autarquias: [
      {
        sigla: 'IPHAN',
        nome: 'Instituto do Patrimônio Histórico e Artístico Nacional',
        keywords: ['instituto do patrimonio historico e artistico nacional', 'iphan', 'superintendencia do iphan'],
      },
      {
        sigla: 'FUNARTE',
        nome: 'Fundação Nacional de Artes',
        keywords: ['fundacao nacional de artes', 'funarte'],
      },
      {
        sigla: 'FBN',
        nome: 'Fundação Biblioteca Nacional',
        keywords: ['fundacao biblioteca nacional', 'fbn'],
      },
      {
        sigla: 'FCP',
        nome: 'Fundação Cultural Palmares',
        keywords: ['fundacao cultural palmares', 'fcp'],
      },
      {
        sigla: 'IBRAM',
        nome: 'Instituto Brasileiro de Museus',
        keywords: ['instituto brasileiro de museus', 'ibram'],
      },
      {
        sigla: 'ANCINE',
        nome: 'Agência Nacional do Cinema',
        keywords: ['agencia nacional do cinema', 'ancine'],
      },
      {
        sigla: 'Casa de Rui Barbosa',
        nome: 'Fundação Casa de Rui Barbosa',
        keywords: ['fundacao casa de rui barbosa', 'fcrb'],
      },
    ],
  },
  {
    slug: 'mesp',
    sigla: 'MEsp',
    nome: 'Ministério do Esporte',
    keywords: [
      'ministerio do esporte', 'mesp', 'secretaria nacional de esportes de alto rendimento',
      'secretaria nacional de futebol e defesa dos direitos do torcedor',
      'secretaria nacional de esporte amador, educacao, lazer e inclusao social',
    ],
    autarquias: [
      {
        sigla: 'ABCD',
        nome: 'Autoridade Brasileira de Controle de Dopagem',
        keywords: ['autoridade brasileira de controle de dopagem', 'abcd'],
      },
    ],
  },
  {
    slug: 'mcti',
    sigla: 'MCTI',
    nome: 'Ministério da Ciência, Tecnologia e Inovação',
    keywords: [
      'ministerio da ciencia, tecnologia e inovacao', 'mcti', 'ministerio da ciencia e tecnologia',
      'secretaria de ciencia e tecnologia para transformacao digital',
    ],
    autarquias: [
      {
        sigla: 'CNPq',
        nome: 'Conselho Nacional de Desenvolvimento Científico e Tecnológico',
        keywords: ['conselho nacional de desenvolvimento cientifico e tecnologico', 'cnpq'],
      },
      {
        sigla: 'FINEP',
        nome: 'Financiadora de Estudos e Projetos',
        keywords: ['financiadora de estudos e projetos', 'finep'],
      },
      {
        sigla: 'AEB',
        nome: 'Agência Espacial Brasileira',
        keywords: ['agencia espacial brasileira', 'aeb'],
      },
      {
        sigla: 'CNEN',
        nome: 'Comissão Nacional de Energia Nuclear',
        keywords: ['comissao nacional de energia nuclear', 'cnen'],
      },
      {
        sigla: 'CBPF',
        nome: 'Centro Brasileiro de Pesquisas Físicas',
        keywords: ['centro brasileiro de pesquisas fisicas', 'cbpf'],
      },
    ],
  },
  {
    slug: 'mjsp',
    sigla: 'MJSP',
    nome: 'Ministério da Justiça e Segurança Pública',
    keywords: [
      'ministerio da justica e seguranca publica', 'mjsp', 'ministerio da justica',
      'fundo nacional de seguranca publica', 'fnsp', 'secretaria nacional de seguranca publica',
      'senasp', 'secretaria nacional de politicas sobre drogas', 'senad',
    ],
    autarquias: [
      {
        sigla: 'PRF',
        nome: 'Polícia Rodoviária Federal',
        keywords: ['departamento de policia rodoviaria federal', 'policia rodoviaria federal', 'prf'],
      },
      {
        sigla: 'PF',
        nome: 'Polícia Federal',
        keywords: ['departamento de policia federal', 'policia federal', 'dpf'],
      },
      {
        sigla: 'SENAPPEN',
        nome: 'Secretaria Nacional de Políticas Penais',
        keywords: ['secretaria nacional de politicas penais', 'senappen', 'departamento penitenciario nacional', 'depen'],
      },
      {
        sigla: 'CADE',
        nome: 'Conselho Administrativo de Defesa Econômica',
        keywords: ['conselho administrativo de defesa economica', 'cade'],
      },
      {
        sigla: 'FUNAP',
        nome: 'Fundação Nacional do Índio - Segurança',
        keywords: ['fundacao de amparo ao trabalhador preso', 'funap'],
      },
    ],
  },
  {
    slug: 'mdhc',
    sigla: 'MDHC',
    nome: 'Ministério dos Direitos Humanos e da Cidadania',
    keywords: [
      'ministerio dos direitos humanos e da cidadania', 'mdhc', 'ministerio dos direitos humanos',
      'secretaria nacional dos direitos da crianca e do adolescente', 'secretaria nacional dos direitos da pessoa idosa',
      'secretaria nacional dos direitos da pessoa com deficiencia', 'fundo nacional para a crianca e o adolescente',
    ],
    autarquias: [],
  },
  {
    slug: 'mulheres',
    sigla: 'MMulheres',
    nome: 'Ministério das Mulheres',
    keywords: [
      'ministerio das mulheres', 'secretaria nacional de enfrentamento a violencia contra as mulheres',
      'secretaria nacional de articulacao institucional e acoes tematicas', 'casa da mulher brasileira',
    ],
    autarquias: [],
  },
  {
    slug: 'igualdade_racial',
    sigla: 'MIR',
    nome: 'Ministério da Igualdade Racial',
    keywords: [
      'ministerio da igualdade racial', 'mir', 'secretaria de politicas de acoes afirmativas',
      'secretaria de gestao do sistema nacional de promocao da igualdade racial',
    ],
    autarquias: [],
  },
  {
    slug: 'povos_indigenas',
    sigla: 'MPI',
    nome: 'Ministério dos Povos Indígenas',
    keywords: [
      'ministerio dos povos indigenas', 'mpi', 'secretaria de gestao ambiental e territorial indigena',
      'secretaria de articulacao e promocao dos direitos indigenas',
    ],
    autarquias: [
      {
        sigla: 'FUNAI',
        nome: 'Fundação Nacional dos Povos Indígenas',
        keywords: ['fundacao nacional dos povos indigenas', 'fundacao nacional do indio', 'funai'],
      },
    ],
  },
  {
    slug: 'transportes',
    sigla: 'MT',
    nome: 'Ministério dos Transportes',
    keywords: [
      'ministerio dos transportes', 'secretaria nacional de transporte ferroviario',
      'secretaria nacional de transporte rodoviario',
    ],
    autarquias: [
      {
        sigla: 'DNIT',
        nome: 'Departamento Nacional de Infraestrutura de Transportes',
        keywords: ['departamento nacional de infraestrutura de transportes', 'dnit'],
      },
      {
        sigla: 'ANTT',
        nome: 'Agência Nacional de Transportes Terrestres',
        keywords: ['agencia nacional de transportes terrestres', 'antt'],
      },
      {
        sigla: 'INFRA S.A.',
        nome: 'Infra S.A.',
        keywords: ['infra s.a.', 'epl - empresa de planejamento e logistica', 'valec'],
      },
    ],
  },
  {
    slug: 'portos_aeroportos',
    sigla: 'MPor',
    nome: 'Ministério de Portos e Aeroportos',
    keywords: [
      'ministerio de portos e aeroportos', 'mpor', 'secretaria nacional de aviacaocivil',
      'secretaria nacional de portos e transportes aquaviarios',
    ],
    autarquias: [
      {
        sigla: 'ANAC',
        nome: 'Agência Nacional de Aviação Civil',
        keywords: ['agencia nacional de aviacao civil', 'anac'],
      },
      {
        sigla: 'ANTAQ',
        nome: 'Agência Nacional de Transportes Aquaviários',
        keywords: ['agencia nacional de transportes aquaviarios', 'antaq'],
      },
      {
        sigla: 'INFRAERO',
        nome: 'Empresa Brasileira de Infraestrutura Aeroportuária',
        keywords: ['empresa brasileira de infraestrutura aeroportuaria', 'infraero'],
      },
    ],
  },
  {
    slug: 'minas_energia',
    sigla: 'MME',
    nome: 'Ministério de Minas e Energia',
    keywords: [
      'ministerio de minas e energia', 'mme', 'secretaria de energia eletrica',
      'secretaria de petroleo, gas natural e biocombustiveis', 'secretaria de geologia, mineracao e transformacao mineral',
      'luz para todos',
    ],
    autarquias: [
      {
        sigla: 'ANEEL',
        nome: 'Agência Nacional de Energia Elétrica',
        keywords: ['agencia nacional de energia eletrica', 'aneel'],
      },
      {
        sigla: 'ANP',
        nome: 'Agência Nacional do Petróleo, Gás Natural e Biocombustíveis',
        keywords: ['agencia nacional do petroleo', 'anp'],
      },
      {
        sigla: 'ANM',
        nome: 'Agência Nacional de Mineração',
        keywords: ['agencia nacional de mineracao', 'anm', 'dnpm'],
      },
      {
        sigla: 'EPE',
        nome: 'Empresa de Pesquisa Energética',
        keywords: ['empresa de pesquisa energetica', 'epe'],
      },
    ],
  },
  {
    slug: 'comunicacoes',
    sigla: 'MCom',
    nome: 'Ministério das Comunicações',
    keywords: [
      'ministerio das comunicacoes', 'mcom', 'secretaria de telecomunicacoes',
      'secretaria de radiodifusao', 'norte conectado', 'wi-fi brasil',
    ],
    autarquias: [
      {
        sigla: 'ANATEL',
        nome: 'Agência Nacional de Telecomunicações',
        keywords: ['agencia nacional de telecomunicacoes', 'anatel'],
      },
      {
        sigla: 'TELEBRAS',
        nome: 'Telecomunicações Brasileiras S.A.',
        keywords: ['telecomunicacoes brasileiras s.a.', 'telebras'],
      },
      {
        sigla: 'CORREIOS',
        nome: 'Empresa Brasileira de Correios e Telégrafos',
        keywords: ['empresa brasileira de correios e telegrafos', 'correios', 'ect'],
      },
    ],
  },
  {
    slug: 'turismo',
    sigla: 'MTur',
    nome: 'Ministério do Turismo',
    keywords: [
      'ministerio do turismo', 'mtur', 'secretaria nacional de infraestrutura, credito e investimentos no turismo',
      'secretaria nacional de planejamento, sustentabilidade e competitividade no turismo',
    ],
    autarquias: [
      {
        sigla: 'EMBRATUR',
        nome: 'Agência Brasileira de Promoção Internacional do Turismo',
        keywords: ['agencia brasileira de promocao internacional do turismo', 'embratur', 'instituto brasileiro de turismo'],
      },
    ],
  },
  {
    slug: 'trabalho',
    sigla: 'MTE',
    nome: 'Ministério do Trabalho e Emprego',
    keywords: [
      'ministerio do trabalho e emprego', 'mte', 'ministerio do trabalho',
      'secretaria de qualificacao e fomento a geracao de emprego e renda',
      'secretaria nacional de economia solidaria',
    ],
    autarquias: [
      {
        sigla: 'FUNDACENTRO',
        nome: 'Fundação Jorge Duprat Figueiredo de Segurança e Medicina do Trabalho',
        keywords: ['fundacao jorge duprat figueiredo', 'fundacentro'],
      },
    ],
  },
  {
    slug: 'previdencia',
    sigla: 'MPS',
    nome: 'Ministério da Previdência Social',
    keywords: [
      'ministerio da previdencia social', 'mps', 'secretaria de regime geral de previdencia social',
      'secretaria de regime proprio de previdencia social',
    ],
    autarquias: [
      {
        sigla: 'PREVIC',
        nome: 'Superintendência Nacional de Previdência Complementar',
        keywords: ['superintendencia nacional de previdencia complementar', 'previc'],
      },
    ],
  },
  {
    slug: 'gestao_inovacao',
    sigla: 'MGI',
    nome: 'Ministério da Gestão e da Inovação em Serviços Públicos',
    keywords: [
      'ministerio da gestao e da inovacao em servicos publicos', 'mgi', 'ministerio da gestao',
      'secretaria de gestao e inovacao', 'secretaria do patrimonio da uniao', 'spu',
      'secretaria de governo digital', 'transferegov',
    ],
    autarquias: [
      {
        sigla: 'ENAP',
        nome: 'Fundação Escola Nacional de Administração Pública',
        keywords: ['fundacao escola nacional de administracao publica', 'enap'],
      },
      {
        sigla: 'DATAPREV',
        nome: 'Empresa de Tecnologia e Informações da Previdência',
        keywords: ['empresa de tecnologia e informacoes da previdencia', 'dataprev'],
      },
      {
        sigla: 'SERPRO',
        nome: 'Serviço Federal de Processamento de Dados',
        keywords: ['servico federal de processamento de dados', 'serpro'],
      },
    ],
  },
  {
    slug: 'planejamento',
    sigla: 'MPO',
    nome: 'Ministério do Planejamento e Orçamento',
    keywords: [
      'ministerio do planejamento e orcamento', 'mpo', 'ministerio do planejamento',
      'secretaria de orcamento federal', 'sof', 'secretaria de assuntos internacionais e desenvolvimento',
    ],
    autarquias: [
      {
        sigla: 'IBGE',
        nome: 'Fundação Instituto Brasileiro de Geografia e Estatística',
        keywords: ['fundacao instituto brasileiro de geografia e estatistica', 'ibge'],
      },
      {
        sigla: 'IPEA',
        nome: 'Fundação Instituto de Pesquisa Econômica Aplicada',
        keywords: ['fundacao instituto de pesquisa economica aplicada', 'ipea'],
      },
    ],
  },
  {
    slug: 'fazenda',
    sigla: 'MF',
    nome: 'Ministério da Fazenda',
    keywords: [
      'ministerio da fazenda', 'mf', 'secretaria da receita federal do brasil',
      'secretaria do tesouro nacional', 'stn', 'secretaria de reformas economicas',
    ],
    autarquias: [
      {
        sigla: 'RFB',
        nome: 'Secretaria Especial da Receita Federal do Brasil',
        keywords: ['receita federal do brasil', 'secretaria da receita federal', 'rfb'],
      },
      {
        sigla: 'CVM',
        nome: 'Comissão de Valores Mobiliários',
        keywords: ['comissao de valores mobiliarios', 'cvm'],
      },
      {
        sigla: 'SUSEP',
        nome: 'Superintendência de Seguros Privados',
        keywords: ['superintendencia de seguros privados', 'susep'],
      },
      {
        sigla: 'BACEN',
        nome: 'Banco Central do Brasil',
        keywords: ['banco central do brasil', 'bacen', 'bcb'],
      },
    ],
  },
  {
    slug: 'mdic',
    sigla: 'MDIC',
    nome: 'Ministério do Desenvolvimento, Indústria, Comércio e Serviços',
    keywords: [
      'ministerio do desenvolvimento, industria, comercio e servicos', 'mdic',
      'secretaria de desenvolvimento industrial, inovacao, comercio e servicos',
    ],
    autarquias: [
      {
        sigla: 'INPI',
        nome: 'Instituto Nacional da Propriedade Industrial',
        keywords: ['instituto nacional da propriedade industrial', 'inpi'],
      },
      {
        sigla: 'INMETRO',
        nome: 'Instituto Nacional de Metrologia, Qualidade e Tecnologia',
        keywords: ['instituto nacional de metrologia', 'inmetro'],
      },
      {
        sigla: 'ABDI',
        nome: 'Agência Brasileira de Desenvolvimento Industrial',
        keywords: ['agencia brasileira de desenvolvimento industrial', 'abdi'],
      },
      {
        sigla: 'APEX-Brasil',
        nome: 'Agência Brasileira de Promoção de Exportações e Investimentos',
        keywords: ['agencia brasileira de promocao de exportacoes e investimentos', 'apex-brasil', 'apexbrasil'],
      },
    ],
  },
  {
    slug: 'defesa',
    sigla: 'MD',
    nome: 'Ministério da Defesa',
    keywords: [
      'ministerio da defesa', 'md', 'secretaria-geral do ministerio da defesa',
      'programa calha norte', 'calha norte', 'hospital das forcas armadas',
    ],
    autarquias: [
      {
        sigla: 'Exército',
        nome: 'Comando do Exército',
        keywords: ['comando do exercito', 'exercito brasileiro', '10a regiao militar', 'batalhao de engenharia de construcao', 'operacao carro-pipa'],
      },
      {
        sigla: 'Marinha',
        nome: 'Comando da Marinha',
        keywords: ['comando da marinha', 'marinha do brasil', 'capitania dos portos do ceara'],
      },
      {
        sigla: 'Aeronáutica',
        nome: 'Comando da Aeronáutica',
        keywords: ['comando da aeronautica', 'forca aerea brasileira', 'base aerea de fortaleza'],
      },
    ],
  },
  {
    slug: 'pesca',
    sigla: 'MPA',
    nome: 'Ministério da Pesca e Aquicultura',
    keywords: [
      'ministerio da pesca e aquicultura', 'mpa', 'secretaria nacional de pesca artesanal',
      'secretaria nacional de aquicultura', 'secretaria nacional de registro e monitoramento da pesca',
    ],
    autarquias: [],
  },
  {
    slug: 'presidencia',
    sigla: 'PR',
    nome: 'Presidência da República & Bancos Públicos',
    keywords: [
      'presidencia da republica', 'secretaria-geral da presidencia', 'casa civil',
      'secretaria de relacoes institucionais', 'gabinete de seguranca institucional',
      'advocacia-geral da uniao', 'agu', 'controladoria-geral da uniao', 'cgu',
    ],
    autarquias: [
      {
        sigla: 'BNB',
        nome: 'Banco do Nordeste do Brasil',
        keywords: ['banco do nordeste do brasil', 'banco do nordeste', 'bnb', 'fundo constitucional de financiamento do nordeste', 'fne'],
      },
      {
        sigla: 'CAIXA',
        nome: 'Caixa Econômica Federal',
        keywords: ['caixa economica federal', 'cef', 'caixa'],
      },
      {
        sigla: 'BNDES',
        nome: 'Banco Nacional de Desenvolvimento Econômico e Social',
        keywords: ['banco nacional de desenvolvimento economico e social', 'bndes'],
      },
      {
        sigla: 'BB',
        nome: 'Banco do Brasil',
        keywords: ['banco do brasil', 'fundacao banco do brasil'],
      },
    ],
  },
];

function normalize(s?: string | null): string {
  if (!s) return '';
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Examina a razão social do órgão, unidade compradora, objeto e informações
 * complementares e resolve o Ministério Superior, sigla, slug e a Autarquia Vinculada.
 */
export function resolveFederalMinistryAndAutarchy(context: {
  razaoSocial?: string | null;
  nomeUnidade?: string | null;
  objeto?: string | null;
  esfera?: string | null;
}): {
  ministerio: string;
  ministerio_slug: string;
  ministerio_sigla: string;
  autarquia: string | null;
} {
  const normRazao = normalize(context.razaoSocial);
  const normUnidade = normalize(context.nomeUnidade);
  const normObjeto = normalize(context.objeto);
  const combined = `${normRazao} ${normUnidade} ${normObjeto}`;

  // 1. Tenta correspondência direta nas autarquias (para descobrir o ministério pai com precisão)
  for (const min of FEDERAL_MINISTRIES_CATALOG) {
    for (const aut of min.autarquias) {
      const match = aut.keywords.some(
        (kw) => normRazao.includes(kw) || normUnidade.includes(kw) || (kw.length >= 5 && combined.includes(kw)),
      );
      if (match) {
        return {
          ministerio: min.nome,
          ministerio_slug: min.slug,
          ministerio_sigla: min.sigla,
          autarquia: `${aut.sigla} — ${aut.nome}`,
        };
      }
    }
  }

  // 2. Tenta correspondência nos termos do próprio ministério
  for (const min of FEDERAL_MINISTRIES_CATALOG) {
    const match = min.keywords.some((kw) => combined.includes(kw));
    if (match) {
      return {
        ministerio: min.nome,
        ministerio_slug: min.slug,
        ministerio_sigla: min.sigla,
        autarquia: null,
      };
    }
  }

  // 3. Fallback inteligente baseado em órgãos federais comuns ou estado do CE
  if (combined.includes('tribunal') || combined.includes('justica')) {
    return {
      ministerio: 'Poder Judiciário da União',
      ministerio_slug: 'judiciario',
      ministerio_sigla: 'PJU',
      autarquia: context.razaoSocial?.trim() || null,
    };
  }

  if (combined.includes('camara dos deputados') || combined.includes('senado federal') || combined.includes('tribunal de contas da uniao')) {
    return {
      ministerio: 'Poder Legislativo da União',
      ministerio_slug: 'legislativo',
      ministerio_sigla: 'PLU',
      autarquia: context.razaoSocial?.trim() || null,
    };
  }

  // Se for explicitamente da esfera federal
  if (context.esfera === 'F' || context.esfera === 'Federal') {
    return {
      ministerio: context.razaoSocial?.trim() || 'Governo Federal',
      ministerio_slug: 'governo_federal',
      ministerio_sigla: 'GOV',
      autarquia: context.nomeUnidade?.trim() || null,
    };
  }

  return {
    ministerio: context.razaoSocial?.trim() || 'Órgão Público',
    ministerio_slug: 'outros',
    ministerio_sigla: 'OUT',
    autarquia: context.nomeUnidade?.trim() || null,
  };
}
