import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

// ── Tipos retornados pela API oficial ────────────────────────────────────────
// https://dadosabertos.camara.leg.br/swagger/api.html

export interface CamaraEnvelope<T> {
  dados: T;
  links?: Array<{ rel: string; href: string }>;
}

export interface CamaraDeputyDetail {
  id: number;
  nomeCivil?: string;
  ultimoStatus?: {
    id: number;
    nome: string;
    siglaPartido?: string;
    siglaUf?: string;
    urlFoto?: string;
    email?: string;
    idLegislatura?: number;
  };
}

export interface CamaraPropositionListItem {
  id: number;
  uri: string;
  siglaTipo: string;
  numero: number;
  ano: number;
  ementa: string;
}

export interface CamaraPropositionDetail extends CamaraPropositionListItem {
  ementaDetalhada?: string;
  keywords?: string;
  dataApresentacao?: string;
  statusProposicao?: {
    descricaoSituacao?: string;
    descricaoTramitacao?: string;
    despacho?: string;
    dataHora?: string;
    sequencia?: number;
  };
}

export interface CamaraAuthor {
  uri?: string;
  nome?: string;
  tipo?: string;          // "Deputado" | "Comissão" | "Relator" | …
  proponente?: number;    // 1 = principal
  ordemAssinatura?: number;
  siglaPartido?: string;
  siglaUf?: string;
}

export interface CamaraProceeding {
  dataHora?: string;
  sequencia?: number;
  siglaOrgao?: string;
  descricaoTramitacao?: string;
  descricaoSituacao?: string;
  despacho?: string;
  ambito?: string;
}

export interface CamaraVoting {
  id: string;
  uri?: string;
  data?: string;
  dataHoraRegistro?: string;
  proposicaoObjeto?: string;
  tipoVotacao?: string;           // 'Nominal' | 'Simbólica' | 'Secreta'
  proposicao_?: {
    id: number;
    siglaTipo?: string;
    numero?: number;
    ano?: number;
    ementa?: string;
    uri?: string;
  };
}

export interface CamaraVote {
  tipoVoto?: string;
  dataRegistroVoto?: string;
  deputado_?: { id: number; uri?: string; nome?: string };
}

export interface CamaraDeputyOrgao {
  idOrgao: number;
  siglaOrgao?: string;
  nomeOrgao?: string;
  nomePublicacao?: string;
  titulo?: string;
  codTitulo?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface CamaraFrente {
  id: number;
  uri?: string;
  titulo?: string;
  idLegislatura?: number;
}

export interface CamaraFrenteDetalhe extends CamaraFrente {
  keywords?: string;
  urlWebsite?: string;
  urlDocumento?: string;
  situacao?: string;
  coordenador?: { id: number; uri?: string; nome?: string; siglaPartido?: string; siglaUf?: string };
}

export interface CamaraFrenteMembro {
  id: number;
  uri?: string;
  nome?: string;
  siglaPartido?: string;
  siglaUf?: string;
  titulo?: string;  // role: 'Titular' | 'Coordenador' | 'Presidente'
}

export interface CamaraDespesa {
  ano: number;
  mes: number;
  tipoDespesa?: string;
  codDocumento?: number;
  tipoDocumento?: string;
  dataDocumento?: string;
  numDocumento?: string;
  valorBruto?: number;
  valorGlosa?: number;
  valorLíquido?: number;
  numRessarcimento?: string;
  codLote?: number;
  fornecedor?: string;
  nomeFornecedor?: string;
  cnpjCpfFornecedor?: string;
  urlDocumento?: string;
}

export interface CamaraDiscurso {
  dataHoraInicio?: string;
  dataHoraFim?: string;
  faseEvento?: {
    titulo?: string;
    dataHoraInicio?: string;
    dataHoraFim?: string;
  };
  tipoDiscurso?: string;
  urlTexto?: string;
  urlAudio?: string;
  urlVideo?: string;
  keywords?: string;
  sumario?: string;
  transcricao?: string;
}

// FIX #7 (ALTO): Lista de domínios permitidos para baseURL — impede SSRF
const ALLOWED_BASE_DOMAINS = [
  'dadosabertos.camara.leg.br',
];

/**
 * Cliente HTTP tipado para a API oficial da Câmara dos Deputados.
 * Docs: https://dadosabertos.camara.leg.br/swagger/api.html
 *
 * - Retries com backoff exponencial em 429/5xx (até 3 tentativas).
 * - User-Agent identificável (boa cidadania para APIs públicas).
 * - FIX #7: Validação de domínio para impedir SSRF via env var.
 * - FIX #20: Rate limiting proativo via delay entre requests.
 */
@Injectable()
export class CamaraApiClient {
  private readonly logger = new Logger(CamaraApiClient.name);
  private readonly http: AxiosInstance;

  // FIX #20: Rate limiting — delay mínimo entre requests (ms)
  private readonly minDelay = Number(process.env.CAMARA_API_MIN_DELAY_MS ?? 200);
  private lastRequestAt = 0;

  constructor() {
    const baseURL = process.env.CAMARA_API_BASE_URL ?? 'https://dadosabertos.camara.leg.br/api/v2';

    // FIX #7: Validar que a URL base pertence a um domínio confiável
    this.validateBaseUrl(baseURL);

    this.http = axios.create({
      baseURL,
      timeout: 30_000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'luizianne-leis/0.1 (+https://github.com/pedroqvd/luizianne-leis)',
      },
    });
    this.installRetryInterceptor();
    this.installRateLimitInterceptor();
  }

  /**
   * FIX #7 (ALTO): Impede SSRF validando que o baseURL aponta para domínios confiáveis.
   */
  private validateBaseUrl(url: string) {
    try {
      const parsed = new URL(url);
      const allowed = ALLOWED_BASE_DOMAINS.some((d) => parsed.hostname.endsWith(d));
      if (!allowed) {
        throw new Error(
          `CAMARA_API_BASE_URL domain "${parsed.hostname}" is not in the allowed list: ${ALLOWED_BASE_DOMAINS.join(', ')}`,
        );
      }
    } catch (e: any) {
      if (e.message.includes('not in the allowed list')) throw e;
      throw new Error(`Invalid CAMARA_API_BASE_URL: ${url}`);
    }
  }

  private installRetryInterceptor() {
    this.http.interceptors.response.use(
      (r) => r,
      async (err: AxiosError) => {
        const cfg = err.config as AxiosRequestConfig & { _retryCount?: number };
        if (!cfg) return Promise.reject(err);

        const status = err.response?.status ?? 0;
        const retriable =
          status === 429 ||
          (status >= 500 && status < 600) ||
          err.code === 'ECONNABORTED' ||
          err.code === 'ETIMEDOUT' ||
          err.code === 'ECONNRESET';

        cfg._retryCount = cfg._retryCount ?? 0;
        if (!retriable || cfg._retryCount >= 3) return Promise.reject(err);

        cfg._retryCount += 1;
        const delay = 500 * 2 ** cfg._retryCount; // 1s, 2s, 4s
        this.logger.debug(
          `retry ${cfg._retryCount}/3 in ${delay}ms — ${cfg.method?.toUpperCase()} ${cfg.url} (status=${status})`,
        );
        await new Promise((r) => setTimeout(r, delay));
        return this.http.request(cfg);
      },
    );
  }

  /**
   * FIX #20 (MÉDIO): Rate limiting proativo — garante delay mínimo entre requests.
   */
  private installRateLimitInterceptor() {
    this.http.interceptors.request.use(async (config) => {
      const now = Date.now();
      const elapsed = now - this.lastRequestAt;
      if (elapsed < this.minDelay) {
        await new Promise((r) => setTimeout(r, this.minDelay - elapsed));
      }
      this.lastRequestAt = Date.now();
      return config;
    });
  }

  // ── Endpoints ──────────────────────────────────────────────────────────────

  async getDeputy(id: number): Promise<CamaraDeputyDetail | null> {
    const { data } = await this.http.get<CamaraEnvelope<CamaraDeputyDetail>>(
      `/deputados/${id}`,
    );
    return data?.dados ?? null;
  }

  async listAuthoredPropositions(
    deputyId: number,
    page = 1,
    itens = 100,
  ): Promise<{ items: CamaraPropositionListItem[]; links: { rel: string; href: string }[] }> {
    const { data } = await this.http.get<CamaraEnvelope<CamaraPropositionListItem[]>>(
      '/proposicoes',
      {
        params: {
          idDeputadoAutor: deputyId,
          dataApresentacaoInicio: process.env.INGEST_DATA_INICIO ?? '2015-02-01',
          ordem: 'DESC',
          ordenarPor: 'id',
          pagina: page,
          itens,
        },
      },
    );
    return { items: data?.dados ?? [], links: data?.links ?? [] };
  }

  /** Iterador assíncrono que segue links HATEOAS `rel=next`. */
  async *iterAuthoredPropositions(
    deputyId: number,
    itens = 100,
  ): AsyncGenerator<CamaraPropositionListItem> {
    let page = 1;
    while (page <= 500) { // circuit breaker guard
      const { items, links } = await this.listAuthoredPropositions(deputyId, page, itens);
      for (const item of items) yield item;
      const hasNext = links.some((l) => l.rel === 'next');
      if (!hasNext || items.length < itens) return;
      page += 1;
    }
  }

  async getProposition(id: number): Promise<CamaraPropositionDetail | null> {
    const { data } = await this.http.get<CamaraEnvelope<CamaraPropositionDetail>>(
      `/proposicoes/${id}`,
    );
    return data?.dados ?? null;
  }

  async getPropositionAuthors(id: number): Promise<CamaraAuthor[]> {
    const { data } = await this.http.get<CamaraEnvelope<CamaraAuthor[]>>(
      `/proposicoes/${id}/autores`,
    );
    return data?.dados ?? [];
  }

  async getPropositionProceedings(id: number): Promise<CamaraProceeding[]> {
    const { data } = await this.http.get<CamaraEnvelope<CamaraProceeding[]>>(
      `/proposicoes/${id}/tramitacoes`,
      { params: { itens: 1000 } }, // FIX: API default truncates at ~100
    );
    return data?.dados ?? [];
  }

  async getPropositionVotes(id: number): Promise<CamaraVoting[]> {
    const { data } = await this.http.get<CamaraEnvelope<CamaraVoting[]>>(
      `/proposicoes/${id}/votacoes`,
      { params: { itens: 1000 } }, // FIX: API default truncates
    );
    return data?.dados ?? [];
  }

  async getVoteDetails(votacaoId: string): Promise<CamaraVote[]> {
    const { data } = await this.http.get<CamaraEnvelope<CamaraVote[]>>(
      `/votacoes/${votacaoId}/votos`,
    );
    return data?.dados ?? [];
  }

  /** Proposições onde a deputada figura como relatora (idDeputadoRelator). */
  async listRelatorPropositions(
    deputyId: number,
    page = 1,
    itens = 100,
  ): Promise<{ items: CamaraPropositionListItem[]; hasNext: boolean }> {
    const { data } = await this.http.get<CamaraEnvelope<CamaraPropositionListItem[]>>(
      '/proposicoes',
      {
        params: {
          idDeputadoRelator: deputyId,
          dataApresentacaoInicio: process.env.INGEST_DATA_INICIO ?? '2015-02-01',
          ordem: 'DESC',
          ordenarPor: 'id',
          pagina: page,
          itens,
        },
      },
    );
    const items = data?.dados ?? [];
    const hasNext = (data?.links ?? []).some((l) => l.rel === 'next') && items.length >= itens;
    return { items, hasNext };
  }

  async listCommissionPropositions(
    siglaOrgao: string,
    page = 1,
    itens = 100,
  ): Promise<{ items: CamaraPropositionListItem[]; hasNext: boolean }> {
    const { data } = await this.http.get<CamaraEnvelope<CamaraPropositionListItem[]>>(
      '/proposicoes',
      {
        params: {
          siglaOrgaoAutor: siglaOrgao,
          dataApresentacaoInicio: process.env.INGEST_DATA_INICIO ?? '2015-02-01',
          ordem: 'DESC',
          ordenarPor: 'id',
          pagina: page,
          itens,
        },
      },
    );
    const items = data?.dados ?? [];
    const hasNext = (data?.links ?? []).some((l) => l.rel === 'next') && items.length >= itens;
    return { items, hasNext };
  }

  async listNominalVotings(
    dataInicio: string,
    dataFim: string,
    page = 1,
    itens = 200,
  ): Promise<{ items: CamaraVoting[]; hasNext: boolean }> {
    const { data } = await this.http.get<CamaraEnvelope<CamaraVoting[]>>(
      '/votacoes',
      {
        params: {
          dataInicio,
          dataFim,
          tipoVotacao: 'Nominal',
          pagina: page,
          itens,
          ordem: 'ASC',
          ordenarPor: 'dataHoraRegistro',
        },
      },
    );
    const items = data?.dados ?? [];
    const hasNext = (data?.links ?? []).some((l) => l.rel === 'next') && items.length >= itens;
    return { items, hasNext };
  }

  /** CEAP — cotas parlamentares do deputado, paginadas por ano/mês. */
  async *iterDeputyExpenses(
    deputyId: number,
    anoInicio = 2015,
  ): AsyncGenerator<CamaraDespesa> {
    const anoFim = new Date().getFullYear();
    for (let ano = anoFim; ano >= anoInicio; ano--) {
      let page = 1;
      while (page <= 100) {
        const { data } = await this.http.get<CamaraEnvelope<CamaraDespesa[]>>(
          `/deputados/${deputyId}/despesas`,
          { params: { ano, pagina: page, itens: 100 } },
        );
        const items = data?.dados ?? [];
        for (const item of items) yield item;
        const hasNext = (data?.links ?? []).some((l) => l.rel === 'next') && items.length >= 100;
        if (!hasNext) break;
        page++;
      }
    }
  }

  /** Discursos do deputado no Plenário, paginados do mais recente ao mais antigo. */
  async *iterDeputySpeeches(
    deputyId: number,
    dataInicio?: string,
    dataFim?: string,
  ): AsyncGenerator<CamaraDiscurso> {
    let page = 1;
    while (page <= 500) {
      const { data } = await this.http.get<CamaraEnvelope<CamaraDiscurso[]>>(
        `/deputados/${deputyId}/discursos`,
        {
          params: {
            dataInicio: dataInicio ?? process.env.INGEST_DATA_INICIO ?? '2015-02-01',
            dataFim: dataFim ?? new Date().toISOString().slice(0, 10),
            ordenarPor: 'dataHoraInicio',
            ordem: 'DESC',
            pagina: page,
            itens: 100,
          },
        },
      );
      const items = data?.dados ?? [];
      for (const item of items) yield item;
      const hasNext = (data?.links ?? []).some((l) => l.rel === 'next') && items.length >= 100;
      if (!hasNext) break;
      page++;
    }
  }

  async getDeputyCommissions(deputyId: number): Promise<CamaraDeputyOrgao[]> {
    // FIX: Paginate to prevent silent truncation when >100 commissions
    const allItems: CamaraDeputyOrgao[] = [];
    let page = 1;
    while (page <= 50) {
      const { data } = await this.http.get<CamaraEnvelope<CamaraDeputyOrgao[]>>(
        `/deputados/${deputyId}/orgaos`,
        {
          params: {
            dataInicio: process.env.INGEST_DATA_INICIO ?? '2015-02-01',
            itens: 100,
            pagina: page,
          },
        },
      );
      const items = data?.dados ?? [];
      allItems.push(...items);
      const hasNext = (data?.links ?? []).some((l) => l.rel === 'next');
      if (!hasNext || items.length < 100) break;
      page++;
    }
    return allItems;
  }

  async getDeputyFronts(deputyId: number): Promise<CamaraFrente[]> {
    const { data } = await this.http.get<CamaraEnvelope<CamaraFrente[]>>(
      `/deputados/${deputyId}/frentes`,
    );
    return data?.dados ?? [];
  }

  async getFrenteDetail(frenteId: number): Promise<CamaraFrenteDetalhe | null> {
    try {
      const { data } = await this.http.get<CamaraEnvelope<CamaraFrenteDetalhe>>(
        `/frentes/${frenteId}`,
      );
      return data?.dados ?? null;
    } catch {
      return null;
    }
  }

  async getFrenteMembers(frenteId: number): Promise<CamaraFrenteMembro[]> {
    try {
      const { data } = await this.http.get<CamaraEnvelope<CamaraFrenteMembro[]>>(
        `/frentes/${frenteId}/membros`,
      );
      return data?.dados ?? [];
    } catch {
      return [];
    }
  }
}

export function extractDeputyIdFromUri(uri?: string): number | null {
  if (!uri) return null;
  const m = uri.match(/\/deputados\/(\d+)/);
  return m ? Number(m[1]) : null;
}

export function camaraPropositionWebUrl(id: number): string {
  return `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${id}`;
}

export function mapAuthorRole(
  tipo?: string,
  proponente?: number,
  ordem?: number,
): 'author' | 'coauthor' | 'rapporteur' {
  const t = (tipo ?? '').toLowerCase();
  if (t.includes('relator')) return 'rapporteur';
  if (proponente === 1 || ordem === 1) return 'author';
  return 'coauthor';
}
