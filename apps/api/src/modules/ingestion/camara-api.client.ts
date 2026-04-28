import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

/**
 * Cliente HTTP para a API oficial da Câmara dos Deputados.
 * Docs: https://dadosabertos.camara.leg.br/swagger/api.html
 */
@Injectable()
export class CamaraApiClient {
  private readonly logger = new Logger(CamaraApiClient.name);
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: process.env.CAMARA_API_BASE_URL ?? 'https://dadosabertos.camara.leg.br/api/v2',
      timeout: 30_000,
      headers: { Accept: 'application/json' },
    });

    this.http.interceptors.response.use(
      (r) => r,
      async (err) => {
        const status = err?.response?.status;
        if (status === 429 || (status >= 500 && status < 600)) {
          await new Promise((r) => setTimeout(r, 1500));
          return this.http.request(err.config);
        }
        return Promise.reject(err);
      },
    );
  }

  async getDeputy(id: number) {
    const { data } = await this.http.get(`/deputados/${id}`);
    return data?.dados;
  }

  async listAuthoredPropositions(deputyId: number, page = 1, itens = 100) {
    const { data } = await this.http.get('/proposicoes', {
      params: { idDeputadoAutor: deputyId, ordem: 'DESC', ordenarPor: 'id', pagina: page, itens },
    });
    return { items: data?.dados ?? [], links: data?.links ?? [] };
  }

  async getProposition(id: number) {
    const { data } = await this.http.get(`/proposicoes/${id}`);
    return data?.dados;
  }

  async getPropositionAuthors(id: number) {
    const { data } = await this.http.get(`/proposicoes/${id}/autores`);
    return data?.dados ?? [];
  }

  async getPropositionProceedings(id: number) {
    const { data } = await this.http.get(`/proposicoes/${id}/tramitacoes`);
    return data?.dados ?? [];
  }

  async getPropositionVotes(id: number) {
    const { data } = await this.http.get(`/proposicoes/${id}/votacoes`);
    return data?.dados ?? [];
  }

  async getVoteDetails(votacaoId: string) {
    const { data } = await this.http.get(`/votacoes/${votacaoId}/votos`);
    return data?.dados ?? [];
  }

  async getDeputyCommissions(deputyId: number) {
    const { data } = await this.http.get(`/deputados/${deputyId}/orgaos`);
    return data?.dados ?? [];
  }
}
