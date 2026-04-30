import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface TransparenciaEmenda {
  codigoEmenda?: string;
  ano?: number;
  nomeAutor?: string;
  tipoEmenda?: string;           // Individual | Bancada | Comissão
  codigoFuncao?: string;
  descricaoFuncao?: string;
  codigoSubfuncao?: string;
  descricaoSubfuncao?: string;
  nomeOrgaoSuperior?: string;
  nomeOrgao?: string;
  descricao?: string;
  valorDotacaoAtualizada?: number;
  valorEmpenhado?: number;
  valorLiquidado?: number;
  valorPago?: number;
  localidadeGasto?: string;
  nomeMunicipio?: string;
  siglaUf?: string;
}

/**
 * Cliente para o Portal da Transparência do Governo Federal.
 * Docs: https://api.portaldatransparencia.gov.br/swagger-ui.html
 *
 * Requer TRANSPARENCIA_API_KEY (gratuita em portaldatransparencia.gov.br/api).
 * Sem a chave, o módulo loga um aviso e não inicia a ingestão.
 */
@Injectable()
export class TransparenciaApiClient {
  private readonly logger = new Logger(TransparenciaApiClient.name);
  private readonly http: AxiosInstance | null;

  constructor() {
    const key = process.env.TRANSPARENCIA_API_KEY;
    if (!key) {
      this.logger.warn('TRANSPARENCIA_API_KEY não configurada — ingestão de emendas desabilitada');
      this.http = null;
      return;
    }

    this.http = axios.create({
      baseURL: 'https://api.portaldatransparencia.gov.br/api-de-dados',
      headers: {
        'chave-api-dados': key,
        'Accept': 'application/json',
        'User-Agent': 'luizianne-monitor/1.0',
      },
      timeout: 30_000,
    });

    // Retry em 429/5xx
    this.http.interceptors.response.use(undefined, async (err) => {
      const status = err?.response?.status;
      if ((status === 429 || (status >= 500 && status < 600)) && !err.config._retry) {
        err.config._retry = true;
        await delay(3000);
        return this.http!.request(err.config);
      }
      throw err;
    });
  }

  get available() { return this.http !== null; }

  /**
   * Busca emendas de um determinado ano pela autora.
   * Usa nomeAutor como filtro primário; pode ser refinado via DEPUTY_TRANSPARENCIA_CODE.
   */
  async listEmendas(ano: number, page = 1, size = 100): Promise<TransparenciaEmenda[]> {
    if (!this.http) return [];

    const nomeAutor = process.env.DEPUTY_TRANSPARENCIA_NAME ?? 'LUIZIANNE LINS';
    const codigoAutor = process.env.DEPUTY_TRANSPARENCIA_CODE ?? '';

    const params: Record<string, any> = {
      ano,
      pagina: page,
      quantidade: size,
    };

    if (codigoAutor) {
      params.codigoAutor = codigoAutor;
    } else {
      params.nomeAutor = nomeAutor;
    }

    try {
      const { data } = await this.http.get<TransparenciaEmenda[]>('/emendas', { params });
      return Array.isArray(data) ? data : [];
    } catch (e: any) {
      this.logger.warn(`listEmendas(${ano} p${page}) error: ${e.message}`);
      return [];
    }
  }

  /** Itera todas as páginas de um ano. */
  async *iterEmendasAno(ano: number): AsyncGenerator<TransparenciaEmenda> {
    let page = 1;
    while (true) {
      const items = await this.listEmendas(ano, page, 100);
      if (!items.length) break;
      yield* items;
      if (items.length < 100) break;
      page++;
    }
  }
}

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
