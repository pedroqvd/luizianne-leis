import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

export interface TransparenciaEmenda {
  codigoEmenda?: string;
  localizador?: string;
  ano?: number;
  nomeAutor?: string;
  tipoEmenda?: string;
  codigoFuncao?: string;
  descricaoFuncao?: string;
  codigoSubfuncao?: string;
  descricaoSubfuncao?: string;
  codigoProgramatica?: string;
  descricaoProgramatica?: string;
  codigoGND?: string;
  descricaoGND?: string;
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

// FIX B3: Domínios permitidos para APIs de dados governamentais
const ALLOWED_TRANSPARENCIA_DOMAINS = [
  'portaldatransparencia.gov.br',
  'api.portaldatransparencia.gov.br',
];

/**
 * Cliente para o Portal da Transparência do Governo Federal.
 * Docs: https://api.portaldatransparencia.gov.br/swagger-ui.html
 *
 * FIX B2 (MÉDIO): Retry com contador e backoff exponencial (até 3 tentativas).
 * FIX B3 (MÉDIO): Validação de domínio para impedir SSRF.
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

    const baseURL = process.env.TRANSPARENCIA_API_BASE_URL
      ?? 'https://api.portaldatransparencia.gov.br/api-de-dados';

    // FIX B3: Validar domínio
    this.validateBaseUrl(baseURL);

    this.http = axios.create({
      baseURL,
      headers: {
        'chave-api-dados': key,
        'Accept': 'application/json',
        'User-Agent': 'luizianne-monitor/1.0',
      },
      timeout: 30_000,
    });

    // FIX B2: Retry com contador e backoff exponencial
    this.http.interceptors.response.use(undefined, async (err: AxiosError) => {
      const cfg = err.config as AxiosRequestConfig & { _retryCount?: number };
      if (!cfg) return Promise.reject(err);

      const status = err?.response?.status ?? 0;
      const retriable =
        status === 429 ||
        (status >= 500 && status < 600) ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ECONNRESET';

      cfg._retryCount = cfg._retryCount ?? 0;
      if (!retriable || cfg._retryCount >= 3) return Promise.reject(err);

      cfg._retryCount += 1;
      const delay = 1000 * 2 ** cfg._retryCount; // 2s, 4s, 8s
      this.logger.debug(
        `retry ${cfg._retryCount}/3 in ${delay}ms — ${cfg.method?.toUpperCase()} ${cfg.url} (status=${status})`,
      );
      await new Promise((r) => setTimeout(r, delay));
      return this.http!.request(cfg);
    });
  }

  /**
   * FIX B3 (MÉDIO): Validação de domínio para impedir SSRF.
   */
  private validateBaseUrl(url: string) {
    try {
      const parsed = new URL(url);
      const allowed = ALLOWED_TRANSPARENCIA_DOMAINS.some((d) => parsed.hostname.endsWith(d));
      if (!allowed) {
        throw new Error(
          `TRANSPARENCIA_API_BASE_URL domain "${parsed.hostname}" is not allowed: ${ALLOWED_TRANSPARENCIA_DOMAINS.join(', ')}`,
        );
      }
    } catch (e: any) {
      if (e.message.includes('not allowed')) throw e;
      throw new Error(`Invalid TRANSPARENCIA_API_BASE_URL: ${url}`);
    }
  }

  get available() { return this.http !== null; }

  /**
   * FIX #7 (MÉDIO): Executa TODAS as estratégias de busca em paralelo
   * e deduplica resultados por codigoEmenda. A versão anterior parava
   * na primeira strategy que retornasse dados, potencialmente perdendo
   * emendas registradas com variação de nome.
   */
  async listEmendas(ano: number, page = 1, size = 100): Promise<TransparenciaEmenda[]> {
    if (!this.http) return [];

    const nomeAutor = process.env.DEPUTY_TRANSPARENCIA_NAME ?? 'LUIZIANNE LINS';
    const codigoAutor = process.env.DEPUTY_TRANSPARENCIA_CODE ?? '';

    const strategies: Record<string, any>[] = [
      ...(codigoAutor ? [{ ano, pagina: page, quantidade: size, codigoAutor }] : []),
      { ano, pagina: page, quantidade: size, nomeAutor },
      { ano, pagina: page, quantidade: size, nomeAutor: 'LUIZIANNE LINS LOPES' },
      { ano, pagina: page, quantidade: size, nomeAutor: 'LUIZIANNE' },
    ];

    // Run ALL strategies in parallel and merge results
    const results = await Promise.allSettled(
      strategies.map(async (params) => {
        try {
          const { data } = await this.http!.get('/emendas', { params });
          return Array.isArray(data) ? data as TransparenciaEmenda[] : [];
        } catch (e: any) {
          this.logger.warn(`listEmendas(${ano} p${page}) params=${JSON.stringify(params)} error: ${e.response?.status} ${e.message}`);
          return [];
        }
      }),
    );

    // Deduplicate by codigoEmenda
    const seen = new Set<string>();
    const merged: TransparenciaEmenda[] = [];
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      for (const item of r.value) {
        const key = item.codigoEmenda ?? JSON.stringify(item);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      }
    }

    if (merged.length > 0) {
      this.logger.log(`listEmendas(${ano} p${page}) → ${merged.length} emendas (deduped from ${results.reduce((a, r) => a + (r.status === 'fulfilled' ? r.value.length : 0), 0)} raw)`);
    }
    return merged;
  }

  async *iterEmendasAno(ano: number): AsyncGenerator<TransparenciaEmenda> {
    let page = 1;
    while (page <= 200) { // FIX: circuit breaker guard
      const items = await this.listEmendas(ano, page, 100);
      if (!items.length) break;
      yield* items;
      if (items.length < 100) break;
      page++;
    }
  }
}
