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
  titulo?: string;
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Cliente HTTP tipado para a API oficial da Câmara dos Deputados.
 * Docs: https://dadosabertos.camara.leg.br/swagger/api.html
 *
 * - Retries com backoff exponencial em 429/5xx (até 3 tentativas).
 * - User-Agent identificável (boa cidadania para APIs públicas).
 * - Iteração paginada via async generator (`iterAuthoredPropositions`).
 */
@Injectable()
export class CamaraApiClient {
  private readonly logger = new Logger(CamaraApiClient.name);
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL:
        process.env.CAMARA_API_BASE_URL ?? 'https://dadosabertos.camara.leg.br/api/v2',
      timeout: 30_000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'luizianne-leis/0.1 (+https://github.com/pedroqvd/luizianne-leis)',
      },
    });
    this.installRetryInterceptor();
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
    while (true) {
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
    );
    return data?.dados ?? [];
  }

  async getPropositionVotes(id: number): Promise<CamaraVoting[]> {
    const { data } = await this.http.get<CamaraEnvelope<CamaraVoting[]>>(
      `/proposicoes/${id}/votacoes`,
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

  /**
   * Proposições apresentadas por um órgão (comissão) específico.
   * Usado para ingerir propostas da Comissão Mista e outras comissões
   * onde a deputada exerce presidência.
   */
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

  /**
   * Lista TODAS as votações realizadas em um intervalo de datas.
   * Usado pelo rastreador de ausências para detectar nominais em que
   * a deputada não registrou voto.
   */
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

  async getDeputyCommissions(deputyId: number): Promise<CamaraDeputyOrgao[]> {
    const { data } = await this.http.get<CamaraEnvelope<CamaraDeputyOrgao[]>>(
      `/deputados/${deputyId}/orgaos`,
      {
        params: {
          dataInicio: process.env.INGEST_DATA_INICIO ?? '2015-02-01',
          itens: 100,
        },
      },
    );
    return data?.dados ?? [];
  }
}

/**
 * Extrai o id do deputado a partir do uri retornado pela API.
 * Necessário porque `/proposicoes/{id}/autores` não traz `id` direto;
 * traz `uri = ".../deputados/<id>"`. Para autores que são comissões
 * (`uri = ".../orgaos/<id>"`), retorna null.
 */
export function extractDeputyIdFromUri(uri?: string): number | null {
  if (!uri) return null;
  const m = uri.match(/\/deputados\/(\d+)/);
  return m ? Number(m[1]) : null;
}

/**
 * Retorna a URL pública da proposição no site da Câmara dos Deputados.
 * O campo `uri` da API retorna um endpoint JSON (dadosabertos.camara.leg.br)
 * que não é acessível por usuários. A URL correta é a ficha de tramitação.
 */
export function camaraPropositionWebUrl(id: number): string {
  return `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${id}`;
}

/** Mapeia o `tipo`/`proponente`/`ordem` do autor para nosso enum interno. */
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
