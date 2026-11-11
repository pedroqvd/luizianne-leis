import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CacheService } from '../../infra/cache/cache.service';
import { EditaisRepository, EditalFilter } from './editais.repository';
import { EditaisMatchingService } from './editais-matching.service';
import { PncpApiClient } from './pncp-api.client';

@Injectable()
export class EditaisService {
  private readonly logger = new Logger(EditaisService.name);

  constructor(
    private readonly repo: EditaisRepository,
    private readonly matching: EditaisMatchingService,
    private readonly pncp: PncpApiClient,
    private readonly cache: CacheService,
  ) {}

  async list(filter: EditalFilter) {
    const key = `editais:list:${JSON.stringify(filter)}`;
    return this.cache.wrap(key, 90, () => this.repo.list(filter));
  }

  async findById(id: number) {
    const edital = await this.repo.findById(id);
    if (!edital) throw new NotFoundException('Edital não encontrado');

    // Enriquecimento sob demanda (itens e arquivos anexos do PNCP) se ainda vazio
    const itensEmpty =
      !Array.isArray(edital.itens_resumo) || edital.itens_resumo.length === 0;
    const arquivosEmpty =
      !Array.isArray(edital.arquivos_anexos) || edital.arquivos_anexos.length === 0;

    if (edital.origem === 'pncp' && edital.pncp_id && itensEmpty && arquivosEmpty) {
      try {
        const deep = await this.pncp.fetchDeepDetails(edital.pncp_id);
        if (deep.itens_resumo.length > 0 || deep.arquivos_anexos.length > 0) {
          edital.itens_resumo = deep.itens_resumo;
          edital.arquivos_anexos = deep.arquivos_anexos;
          await this.repo.updateDeepDetails(id, deep.itens_resumo, deep.arquivos_anexos);
        }
      } catch (e: any) {
        this.logger.warn(`Failed to enrich deep details for edital ${id}: ${e.message}`);
      }
    }

    const matches = await this.matching.listMatchesForEdital(id);
    return {
      ...edital,
      matches,
    };
  }

  async stats() {
    return this.cache.wrap('editais:stats', 180, () => this.repo.stats());
  }

  async ministries() {
    return this.cache.wrap('editais:ministries', 600, () => this.repo.ministries());
  }

  async ministriesSummary() {
    return this.cache.wrap('editais:by-ministerio', 180, () => this.repo.ministriesSummary());
  }

  async categories() {
    return this.cache.wrap('editais:categories', 300, () => this.repo.categories());
  }

  async listMatches(id: number) {
    return this.matching.listMatchesForEdital(id);
  }

  async recomputeMatches(options?: { editalId?: number; authorityId?: string }) {
    const res = await this.matching.recomputeMatches(options);
    await this.cache.invalidate('editais:*');
    return res;
  }
}
