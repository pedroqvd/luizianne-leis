import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Cliente para a API publica do PNCP (Portal Nacional de Contratacoes Publicas).
 * Docs: https://pncp.gov.br/api/consulta/swagger-ui/index.html
 *
 * FIX B3 (MÉDIO): Validação de domínio para impedir SSRF via env var.
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
  valorTotalEstimado?: number;
  valorTotalHomologado?: number;
  dataAberturaProposta?: string;
  dataEncerramentoProposta?: string;
  dataPublicacaoPncp?: string;
  dataInclusao?: string;
  dataAtualizacao?: string;
  linkSistemaOrigem?: string;
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

export const MODALIDADES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
];

// FIX B3: Domínios permitidos para o PNCP
const ALLOWED_PNCP_DOMAINS = ['pncp.gov.br'];

@Injectable()
export class PncpApiClient {
  private readonly logger = new Logger(PncpApiClient.name);
  private readonly http: AxiosInstance;

  constructor() {
    const baseURL = process.env.PNCP_API_BASE_URL ?? 'https://pncp.gov.br/api/consulta';

    // FIX B3: Validar domínio
    this.validateBaseUrl(baseURL);

    this.http = axios.create({
      baseURL,
      timeout: 30_000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'luizianne-leis/0.1 (+https://github.com/pedroqvd/luizianne-leis)',
      },
    });
    this.installRetry();
  }

  /**
   * FIX B3 (MÉDIO): Impede SSRF validando que a URL base pertence a domínios confiáveis.
   */
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
          status === 429 || (status >= 500 && status < 600) ||
          err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET';
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
  ): Promise<PncpPage> {
    try {
      const { data } = await this.http.get('/v1/contratacoes/proposta', {
        params: {
          dataFinal,
          codigoModalidadeContratacao: modalidade,
          pagina: page,
          tamanhoPagina: size,
        },
      });
      return data;
    } catch (e: any) {
      if (e.response?.status === 422 || e.response?.status === 204) {
        return { data: [], totalRegistros: 0, totalPaginas: 0, numeroPagina: page, paginasRestantes: 0 };
      }
      throw e;
    }
  }

  /**
   * Itera por todas as modalidades para obter editais abertos (próximos 60 dias).
   * Sem limite de páginas — itera até esgotar os resultados.
   */
  async *iterFederalOpen(): AsyncGenerator<PncpItem> {
    const dataFinal = formatPncpDate(addDays(new Date(), 60));
    for (const m of MODALIDADES) {
      let page = 1;
      while (true) {
        const res = await this.listProposalsByModality(dataFinal, m, page, 50);
        if (!res.data?.length) break;
        for (const item of res.data) {
          if (item.orgaoEntidade?.esferaId === 'F') yield item;
        }
        if (res.paginasRestantes <= 0 || page >= res.totalPaginas) break;
        page++;
      }
    }
  }

  /**
   * Itera editais publicados num intervalo de datas (endpoint /publicacao).
   * Permite buscar histórico desde o lançamento do PNCP (~2021).
   * Filtra por esfera Federal.
   */
  async *iterFederalByPublication(dataInicial: string, dataFinal: string): AsyncGenerator<PncpItem> {
    for (const m of MODALIDADES) {
      let page = 1;
      while (true) {
        try {
          const { data: res } = await this.http.get('/v1/contratacoes/publicacao', {
            params: {
              dataInicial,
              dataFinal,
              codigoModalidadeContratacao: m,
              pagina: page,
              tamanhoPagina: 50,
            },
          });
          const items: PncpItem[] = res?.data ?? [];
          if (!items.length) break;
          for (const item of items) {
            if (item.orgaoEntidade?.esferaId === 'F') yield item;
          }
          if ((res?.paginasRestantes ?? 0) <= 0 || page >= (res?.totalPaginas ?? 1)) break;
          page++;
        } catch (e: any) {
          if (e.response?.status === 422 || e.response?.status === 204) break;
          throw e;
        }
      }
    }
  }
}

function buildPncpUrl(item: PncpItem): string {
  const id = item.numeroControlePNCP ?? '';
  const cnpjRaw = (item.orgaoEntidade?.cnpj ?? '').replace(/\D/g, '');
  const match = id.match(/^(\d+)-(\d+)-/);
  const sequencial = match?.[2];
  const ano = item.anoCompra;
  if (cnpjRaw && sequencial && ano) {
    return `https://pncp.gov.br/app/editais/${cnpjRaw}/${ano}/${sequencial}`;
  }
  return `https://pncp.gov.br/app/editais/${id.replace(/\//g, '/')}`;
}

export function pncpToInternal(item: PncpItem) {
  return {
    pncp_id: item.numeroControlePNCP,
    titulo: item.objetoCompra?.slice(0, 200) ?? `${item.modalidadeNome} ${item.numeroCompra}/${item.anoCompra}`,
    orgao: item.orgaoEntidade?.razaoSocial ?? '—',
    ministerio: item.unidadeOrgao?.nomeUnidade ?? item.orgaoEntidade?.razaoSocial ?? '—',
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
    unidade_nome: item.unidadeOrgao?.nomeUnidade ?? null,
    valor_estimado: item.valorTotalEstimado ?? null,
    data_abertura: item.dataAberturaProposta?.slice(0, 10) ?? null,
    data_encerramento: item.dataEncerramentoProposta?.slice(0, 10) ?? null,
    data_proposta_inicio: item.dataAberturaProposta ?? null,
    data_proposta_fim: item.dataEncerramentoProposta ?? null,
    data_publicacao: item.dataPublicacaoPncp?.slice(0, 10) ?? null,
    situacao: deriveSituacao(item),
    url_fonte: buildPncpUrl(item),
    url_edital: item.linkSistemaOrigem ?? null,
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
