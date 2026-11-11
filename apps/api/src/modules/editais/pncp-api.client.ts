import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Cliente para a API pública do PNCP (Portal Nacional de Contratações Públicas).
 * Docs: https://pncp.gov.br/api/consulta/swagger-ui/index.html
 *
 * Inclui:
 * - Validação de domínio anti-SSRF (ALLOWED_PNCP_DOMAINS)
 * - Extração enriquecida de metadados (categoria temática, elegibilidade municipal, amparo legal, modo de disputa)
 * - Busca concorrente por modalidade + suporte a itens e anexos oficiais do edital
 */

export interface PncpItem {
  numeroControlePNCP: string;
  numeroCompra: string;
  anoCompra: number;
  modalidadeId: number;
  modalidadeNome: string;
  situacaoCompraId: number;
  situacaoCompraNome: string;
  objetoCompra: string;
  informacaoComplementar?: string;
  valorTotalEstimado?: number;
  valorTotalHomologado?: number;
  dataAberturaProposta?: string;
  dataEncerramentoProposta?: string;
  dataPublicacaoPncp?: string;
  dataInclusao?: string;
  dataAtualizacao?: string;
  linkSistemaOrigem?: string;
  srp?: boolean;
  modoDisputaId?: number;
  modoDisputaNome?: string;
  criterioJulgamentoId?: number;
  criterioJulgamentoNome?: string;
  amparoLegal?: {
    codigo?: number;
    nome?: string;
    descricao?: string;
  };
  unidadeOrgao?: {
    codigoUnidade?: string;
    nomeUnidade?: string;
    municipioNome?: string;
    ufSigla?: string;
    ufNome?: string;
  };
  orgaoEntidade?: {
    cnpj?: string;
    razaoSocial?: string;
    poderId?: string;
    esferaId?: string;
  };
}

interface PncpPage {
  data: PncpItem[];
  totalRegistros: number;
  totalPaginas: number;
  numeroPagina: number;
  paginasRestantes: number;
}

export interface PncpItemResumo {
  numeroItem: number;
  descricao: string;
  quantidade?: number;
  unidadeMedida?: string;
  valorUnitarioEstimado?: number;
  valorTotal?: number;
}

export interface PncpArquivoAnexo {
  sequencialDocumento?: number;
  titulo: string;
  tipoDocumentoNome?: string;
  url: string;
  dataPublicacaoPncp?: string;
}

const PODER_MAP: Record<string, string> = {
  L: 'Legislativo',
  E: 'Executivo',
  J: 'Judiciário',
  N: 'Não se aplica',
};

const ESFERA_MAP: Record<string, string> = {
  F: 'Federal',
  E: 'Estadual',
  M: 'Municipal',
  D: 'Distrital',
};

const NORDESTE_UFS = new Set(['MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA']);

// Modalidades priorizadas por volume de oportunidades no PNCP
export const MODALIDADES = [
  6, 8, 9, 4, 5, 12, 13, 1, 2, 3, 7, 10, 11, 14,
];

const ALLOWED_PNCP_DOMAINS = ['pncp.gov.br'];

const THEME_TAXONOMY: Array<{ category: string; keywords: string[] }> = [
  {
    category: 'saúde',
    keywords: [
      'ubs', 'unidade basica de saude', 'hospital', 'medicamento', 'ambulancia', 'samu',
      'atencao basica', 'atencao primaria', 'sus', 'equipamento medico', 'equipamento hospitalar',
      'odontologic', 'saude', 'hemocentro', 'upa', 'vacina', 'enfermagem', 'cirurgic', 'leito',
      'fisioterapia', 'laboratorio', 'tomografo', 'raio-x', 'ultrassom', 'maternidade',
    ],
  },
  {
    category: 'educação',
    keywords: [
      'escola', 'creche', 'fnde', 'quadra escolar', 'quadra poliesportiva', 'transporte escolar',
      'onibus escolar', 'merenda', 'alimentacao escolar', 'educacao', 'ensino', 'alfabetizacao',
      'universidade', 'ifce', 'ufc', 'unilab', 'ufca', 'biblioteca', 'mobiliario escolar',
      'creche proinfancia', 'kit escolar', 'laboratorio de informatica',
    ],
  },
  {
    category: 'recursos hídricos',
    keywords: [
      'acude', 'adutora', 'poco profundo', 'poco tubular', 'cisterna', 'barragem',
      'dessalinizador', 'dessalinizacao', 'abastecimento de agua', 'irrigacao', 'recursos hidricos',
      'dnocs', 'funceme', 'cogerh', 'sohidra', 'bacia hidrografica', 'carro-pipa', 'outorga',
    ],
  },
  {
    category: 'infraestrutura',
    keywords: [
      'pavimentacao', 'asfalto', 'asfaltica', 'drenagem', 'ponte', 'estrada vicinal', 'rodovia',
      'iluminacao publica', 'urbanizacao', 'obras de engenharia', 'reforma', 'construcao',
      'saneamento', 'esgotamento sanitario', 'calcamento', 'pedra tosca', 'praca publica',
      'passagem molhada', 'bueiro', 'terraplanagem', 'recapeamento',
    ],
  },
  {
    category: 'agricultura',
    keywords: [
      'agricultura', 'agricultura familiar', 'pronaf', 'trator', 'patrulha mecanizada',
      'semente', 'mudas', 'pesca', 'aquicultura', 'desenvolvimento agrario', 'incra', 'conab',
      'extensao rural', 'ematerce', 'apicultura', 'mandioca', 'casa de farinha', 'caprinocultura',
      'bovinocultura', 'caju', 'agroecologia', 'feira livre', 'abatedouro',
    ],
  },
  {
    category: 'assistência social',
    keywords: [
      'cras', 'creas', 'assistencia social', 'seguranca alimentar', 'cozinha comunitaria',
      'restaurante popular', 'idoso', 'crianca e adolescente', 'acolhimento', 'suas',
      'vulnerabilidade social', 'cesta basica', 'cadastro unico', 'conselho tutelar',
    ],
  },
  {
    category: 'habitação',
    keywords: [
      'habitacao', 'minha casa minha vida', 'moradia', 'unidades habitacionais',
      'regularizacao fundiaria', 'conjunto habitacional', 'melhoria habitacional',
    ],
  },
  {
    category: 'cultura e esporte',
    keywords: [
      'cultura', 'esporte', 'estadio', 'areninha', 'patrimonio historico', 'turismo',
      'lazer', 'juventude', 'audiovisual', 'iphan', 'teatro', 'museu', 'centro cultural',
      'lei paulo gustavo', 'aldir blanc', 'festival', 'quadra esportiva',
    ],
  },
  {
    category: 'meio ambiente',
    keywords: [
      'meio ambiente', 'residuos solidos', 'coleta seletiva', 'reciclagem', 'aterro sanitario',
      'reflorestamento', 'energia solar', 'fotovoltaica', 'parque ecologico', 'ibama',
      'icmbio', 'semace', 'mudancas climaticas', 'desertificacao', 'caatinga',
    ],
  },
  {
    category: 'segurança pública',
    keywords: [
      'seguranca publica', 'guarda municipal', 'videomonitoramento', 'defesa civil',
      'viatura', 'bombeiro', 'policiamento', 'protecao civil', 'iluminacao de seguranca',
    ],
  },
  {
    category: 'desenvolvimento regional',
    keywords: [
      'desenvolvimento regional', 'sudene', 'codevasf', 'arranjo produtivo', 'inovacao',
      'tecnologia', 'conectividade', 'inclusao digital', 'fibra optica', 'empreendedorismo',
    ],
  },
];

@Injectable()
export class PncpApiClient {
  private readonly logger = new Logger(PncpApiClient.name);
  private readonly http: AxiosInstance;

  constructor() {
    const baseURL = process.env.PNCP_API_BASE_URL ?? 'https://pncp.gov.br/api/consulta';
    this.validateBaseUrl(baseURL);

    this.http = axios.create({
      baseURL,
      timeout: 30_000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'luizianne-leis/0.2 (+https://github.com/pedroqvd/luizianne-leis)',
      },
    });
    this.installRetry();
  }

  private validateBaseUrl(url: string) {
    try {
      const parsed = new URL(url);
      const allowed = ALLOWED_PNCP_DOMAINS.some((d) => parsed.hostname.endsWith(d));
      if (!allowed) {
        throw new Error(
          `PNCP_API_BASE_URL domain "${parsed.hostname}" is not in the allowed list: ${ALLOWED_PNCP_DOMAINS.join(', ')}`,
        );
      }
    } catch (e: any) {
      if (e.message.includes('not in the allowed list')) throw e;
      throw new Error(`Invalid PNCP_API_BASE_URL: ${url}`);
    }
  }

  private installRetry() {
    this.http.interceptors.response.use(
      (r) => r,
      async (err: AxiosError) => {
        const cfg = err.config as AxiosRequestConfig & { _retry?: number };
        if (!cfg) return Promise.reject(err);
        const status = err.response?.status ?? 0;
        const retriable =
          status === 429 ||
          (status >= 500 && status < 600) ||
          err.code === 'ECONNABORTED' ||
          err.code === 'ETIMEDOUT' ||
          err.code === 'ECONNRESET';
        cfg._retry = cfg._retry ?? 0;
        if (!retriable || cfg._retry >= 3) return Promise.reject(err);
        cfg._retry++;
        const delay = 500 * 2 ** cfg._retry;
        await new Promise((r) => setTimeout(r, delay));
        return this.http.request(cfg);
      },
    );
  }

  async listProposalsByModality(
    dataFinal: string,
    modalidade: number,
    page = 1,
    size = 50,
    uf?: string,
  ): Promise<PncpPage> {
    try {
      const params: Record<string, any> = {
        dataFinal,
        codigoModalidadeContratacao: modalidade,
        pagina: page,
        tamanhoPagina: size,
      };
      if (uf) params.uf = uf;
      const { data } = await this.http.get('/v1/contratacoes/proposta', { params });
      return data;
    } catch (e: any) {
      if (e.response?.status === 422 || e.response?.status === 204 || e.response?.status === 400) {
        return { data: [], totalRegistros: 0, totalPaginas: 0, numeroPagina: page, paginasRestantes: 0 };
      }
      throw e;
    }
  }

  /**
   * Busca editais federais abertos e também oportunidades no estado do Ceará (UF=CE)
   * usando concorrência controlada entre modalidades para maior velocidade.
   */
  async *iterFederalOpen(maxPagesPerModality = 4): AsyncGenerator<PncpItem> {
    const dataFinal = formatPncpDate(addDays(new Date(), 60));
    const seen = new Set<string>();
    const concurrency = 4;

    for (let i = 0; i < MODALIDADES.length; i += concurrency) {
      const chunk = MODALIDADES.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        chunk.map(async (modalidade) => {
          const collected: PncpItem[] = [];
          let page = 1;
          while (page <= maxPagesPerModality) {
            try {
              const res = await this.listProposalsByModality(dataFinal, modalidade, page, 50);
              if (!res.data?.length) break;
              for (const item of res.data) {
                const isFederal = item.orgaoEntidade?.esferaId === 'F';
                const isCeara = item.unidadeOrgao?.ufSigla === 'CE';
                if (isFederal || isCeara) {
                  collected.push(item);
                }
              }
              if (res.paginasRestantes <= 0 || page >= res.totalPaginas) break;
              page++;
            } catch (err: any) {
              this.logger.warn(`PNCP modality ${modalidade} page ${page} failed: ${err.message}`);
              break;
            }
          }
          return collected;
        }),
      );

      for (const list of batchResults) {
        for (const item of list) {
          if (item.numeroControlePNCP && !seen.has(item.numeroControlePNCP)) {
            seen.add(item.numeroControlePNCP);
            yield item;
          }
        }
      }
    }
  }

  /**
   * Busca itens e arquivos anexos oficiais diretamente no PNCP para enriquecer a página de detalhes.
   */
  async fetchDeepDetails(pncpId: string): Promise<{
    itens_resumo: PncpItemResumo[];
    arquivos_anexos: PncpArquivoAnexo[];
  }> {
    const parsed = parsePncpControlId(pncpId);
    if (!parsed) {
      return { itens_resumo: [], arquivos_anexos: [] };
    }
    const { cnpj, ano, sequencial } = parsed;

    const [itensRes, arquivosRes] = await Promise.allSettled([
      this.http.get(`/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/itens`, {
        params: { pagina: 1, tamanhoPagina: 30 },
        timeout: 10_000,
      }),
      this.http.get(`/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/arquivos`, {
        params: { pagina: 1, tamanhoPagina: 20 },
        timeout: 10_000,
      }),
    ]);

    const itensRaw =
      itensRes.status === 'fulfilled' && Array.isArray(itensRes.value?.data)
        ? itensRes.value.data
        : [];
    const arquivosRaw =
      arquivosRes.status === 'fulfilled' && Array.isArray(arquivosRes.value?.data)
        ? arquivosRes.value.data
        : [];

    const itens_resumo: PncpItemResumo[] = itensRaw.slice(0, 30).map((it: any) => ({
      numeroItem: Number(it.numeroItem ?? 0),
      descricao: String(it.descricao ?? it.materialOuServicoNome ?? 'Item'),
      quantidade: it.quantidade != null ? Number(it.quantidade) : undefined,
      unidadeMedida: it.unidadeMedida ? String(it.unidadeMedida) : undefined,
      valorUnitarioEstimado:
        it.valorUnitarioEstimado != null ? Number(it.valorUnitarioEstimado) : undefined,
      valorTotal: it.valorTotal != null ? Number(it.valorTotal) : undefined,
    }));

    const arquivos_anexos: PncpArquivoAnexo[] = arquivosRaw.slice(0, 20).map((arq: any) => ({
      sequencialDocumento:
        arq.sequencialDocumento != null ? Number(arq.sequencialDocumento) : undefined,
      titulo: String(arq.titulo ?? arq.tipoDocumentoNome ?? 'Documento Anexo'),
      tipoDocumentoNome: arq.tipoDocumentoNome ? String(arq.tipoDocumentoNome) : undefined,
      url:
        arq.url ||
        `https://pncp.gov.br/pncp-api/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/arquivos/${arq.sequencialDocumento ?? 1}`,
      dataPublicacaoPncp: arq.dataPublicacaoPncp ? String(arq.dataPublicacaoPncp) : undefined,
    }));

    return { itens_resumo, arquivos_anexos };
  }
}

/**
 * Extrai { cnpj, ano, sequencial } do numeroControlePNCP no padrão {cnpj}-{tipo}-{sequencial}/{ano}.
 */
export function parsePncpControlId(
  pncpId: string | null | undefined,
): { cnpj: string; ano: string; sequencial: string } | null {
  if (!pncpId) return null;
  const match = pncpId.trim().match(/^(\d{14})-\d+-0*(\d+)\/(\d{4})$/);
  if (!match) return null;
  return {
    cnpj: match[1],
    sequencial: match[2],
    ano: match[3],
  };
}

/**
 * Constrói a URL oficial do edital no portal PNCP.
 * Formato correto: https://pncp.gov.br/app/editais/{cnpj}/{ano}/{sequencial}
 */
export function buildPncpUrl(item: PncpItem): string {
  const parsed = parsePncpControlId(item.numeroControlePNCP);
  if (parsed) {
    return `https://pncp.gov.br/app/editais/${parsed.cnpj}/${parsed.ano}/${parsed.sequencial}`;
  }
  const cnpjRaw = (item.orgaoEntidade?.cnpj ?? '').replace(/\D/g, '');
  const ano = item.anoCompra;
  const seqFromNumero = String(item.numeroCompra ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (cnpjRaw.length === 14 && ano && seqFromNumero) {
    return `https://pncp.gov.br/app/editais/${cnpjRaw}/${ano}/${seqFromNumero}`;
  }
  return 'https://pncp.gov.br/app/editais';
}

function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function classifyEditalTheme(text: string): {
  categoria_tematica: string;
  keywords_extraidas: string[];
} {
  const norm = normalizeText(text);
  let bestCategory = 'gestão e administração';
  let bestHits = 0;
  const matchedKeywords = new Set<string>();

  for (const entry of THEME_TAXONOMY) {
    let hits = 0;
    for (const kw of entry.keywords) {
      if (norm.includes(kw)) {
        hits++;
        matchedKeywords.add(kw);
      }
    }
    if (hits > bestHits) {
      bestHits = hits;
      bestCategory = entry.category;
    }
  }

  return {
    categoria_tematica: bestCategory,
    keywords_extraidas: Array.from(matchedKeywords).slice(0, 15),
  };
}

export function deriveMunicipalEligibility(
  item: PncpItem,
  categoriaTematica: string,
): {
  publico_alvo: string[];
  elegivel_prefeituras: boolean;
  abrangencia: string;
} {
  const uf = (item.unidadeOrgao?.ufSigla ?? '').toUpperCase();
  const fullText = normalizeText(
    [
      item.objetoCompra ?? '',
      item.informacaoComplementar ?? '',
      item.orgaoEntidade?.razaoSocial ?? '',
      item.unidadeOrgao?.nomeUnidade ?? '',
      item.modalidadeNome ?? '',
      item.amparoLegal?.nome ?? '',
      item.amparoLegal?.descricao ?? '',
    ].join(' '),
  );

  const publico: string[] = [];

  const mentionsMunicipality =
    fullText.includes('municipio') ||
    fullText.includes('prefeitura') ||
    fullText.includes('municipal') ||
    fullText.includes('consorcio publico') ||
    fullText.includes('convenio') ||
    fullText.includes('chamamento publico') ||
    fullText.includes('selecao de propostas') ||
    fullText.includes('fundo a fundo') ||
    fullText.includes('doacao') ||
    fullText.includes('adesao');

  const isRegionalAgency =
    fullText.includes('codevasf') ||
    fullText.includes('dnocs') ||
    fullText.includes('sudene') ||
    fullText.includes('fnde') ||
    fullText.includes('fundo nacional de saude') ||
    fullText.includes('incra') ||
    fullText.includes('caixa economica');

  const isSrp =
    Boolean(item.srp) ||
    fullText.includes('registro de precos') ||
    fullText.includes('ata de registro');

  if (mentionsMunicipality || isRegionalAgency) {
    publico.push('prefeituras');
  }
  if (isSrp) {
    publico.push('adesao_ata_srp');
  }
  if (uf === 'CE') {
    publico.push('ceara_direto');
  }
  if (categoriaTematica !== 'gestão e administração') {
    publico.push('interesse_tematico_municipal');
  }
  if (publico.length === 0) {
    publico.push('licitacao_federal');
  }

  const elegivel_prefeituras =
    mentionsMunicipality ||
    isRegionalAgency ||
    isSrp ||
    uf === 'CE' ||
    categoriaTematica !== 'gestão e administração';

  let abrangencia = 'Nacional';
  if (uf === 'CE') {
    abrangencia = 'CE';
  } else if (NORDESTE_UFS.has(uf) || isRegionalAgency) {
    abrangencia = 'Nordeste';
  }

  return {
    publico_alvo: publico,
    elegivel_prefeituras,
    abrangencia,
  };
}

export function pncpToInternal(item: PncpItem) {
  const orgaoRazao = item.orgaoEntidade?.razaoSocial?.trim() || '—';
  const unidadeNome = item.unidadeOrgao?.nomeUnidade?.trim() || null;

  const corpus = [
    item.objetoCompra ?? '',
    item.informacaoComplementar ?? '',
    orgaoRazao,
    unidadeNome ?? '',
  ].join(' ');

  const { categoria_tematica, keywords_extraidas } = classifyEditalTheme(corpus);
  const { publico_alvo, elegivel_prefeituras, abrangencia } = deriveMunicipalEligibility(
    item,
    categoria_tematica,
  );

  const amparoLegal = item.amparoLegal?.nome
    ? item.amparoLegal.descricao
      ? `${item.amparoLegal.nome} — ${item.amparoLegal.descricao}`
      : item.amparoLegal.nome
    : null;

  return {
    pncp_id: item.numeroControlePNCP,
    titulo:
      item.objetoCompra?.slice(0, 200) ??
      `${item.modalidadeNome} ${item.numeroCompra}/${item.anoCompra}`,
    orgao: orgaoRazao,
    // FIX: ministerio mapeia para a Razão Social do Órgão/Entidade Superior (e não a sub-unidade/UASG)
    ministerio: orgaoRazao,
    orgao_superior: orgaoRazao,
    numero: `${item.numeroCompra}/${item.anoCompra}`,
    objeto: item.objetoCompra ?? null,
    modalidade: item.modalidadeNome,
    modalidade_codigo: item.modalidadeId,
    cnpj_orgao: item.orgaoEntidade?.cnpj ?? null,
    poder: PODER_MAP[item.orgaoEntidade?.poderId ?? ''] ?? null,
    esfera: ESFERA_MAP[item.orgaoEntidade?.esferaId ?? ''] ?? null,
    uf: item.unidadeOrgao?.ufSigla ?? null,
    municipio: item.unidadeOrgao?.municipioNome ?? null,
    unidade_codigo: item.unidadeOrgao?.codigoUnidade ?? null,
    unidade_nome: unidadeNome,
    valor_estimado: item.valorTotalEstimado ?? null,
    data_abertura: item.dataAberturaProposta?.slice(0, 10) ?? null,
    data_encerramento: item.dataEncerramentoProposta?.slice(0, 10) ?? null,
    data_proposta_inicio: item.dataAberturaProposta ?? null,
    data_proposta_fim: item.dataEncerramentoProposta ?? null,
    data_publicacao: item.dataPublicacaoPncp?.slice(0, 10) ?? null,
    situacao: deriveSituacao(item),
    url_fonte: buildPncpUrl(item),
    url_edital: item.linkSistemaOrigem ?? null,
    categoria_tematica,
    keywords_extraidas,
    publico_alvo,
    elegivel_prefeituras,
    abrangencia,
    amparo_legal: amparoLegal,
    modo_disputa: item.modoDisputaNome ?? null,
    criterio_julgamento: item.criterioJulgamentoNome ?? null,
    origem: 'pncp',
    payload: item,
  };
}

function deriveSituacao(item: PncpItem): string {
  const nome = (item.situacaoCompraNome ?? '').toLowerCase();
  if (nome.includes('anulad') || nome.includes('revogad')) return 'revogado';
  if (nome.includes('suspens')) return 'suspenso';
  const fim = item.dataEncerramentoProposta ? new Date(item.dataEncerramentoProposta) : null;
  if (fim && fim < new Date()) return 'encerrado';
  return 'aberto';
}

function formatPncpDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}
