import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TransparenciaApiClient } from './transparencia-api.client';
import { EmendasOrcRepository } from './emendas-orc.repository';
import { CacheService } from '../../infra/cache/cache.service';

function parseBrNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  const str = String(v).trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

@Injectable()
export class EmendasOrcIngestion {
  private readonly logger = new Logger(EmendasOrcIngestion.name);
  private running = false;

  constructor(
    private readonly client: TransparenciaApiClient,
    private readonly repo: EmendasOrcRepository,
    private readonly cache: CacheService,
  ) {}

  @Cron(process.env.EMENDAS_ORC_CRON ?? '0 3 * * 5')
  async run() {
    if (!this.client.available) {
      this.logger.warn('TransparenciaApiClient não disponível — configure TRANSPARENCIA_API_KEY');
      return;
    }
    if (this.running) {
      this.logger.warn('emendas ingestion already running, skipping');
      return;
    }
    this.running = true;
    try {
      await this.ingest();
    } finally {
      this.running = false;
    }
  }

  async ingest(): Promise<{ upserted: number }> {
    this.logger.log('starting emendas orçamentárias ingestion');
    let upserted = 0;

    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

    for (const ano of years) {
      this.logger.log(`ingesting emendas ano=${ano}`);
      for await (const e of this.client.iterEmendasAno(ano)) {
        try {
          await this.repo.upsert({
            ano: e.ano ?? ano,
            codigo_emenda: e.codigoEmenda ?? null,
            tipo_emenda: e.tipoEmenda ?? null,
            funcao: e.codigoFuncao ?? null,
            descricao_funcao: e.descricaoFuncao ?? null,
            subfuncao: e.codigoSubfuncao ?? null,
            descricao_subfuncao: e.descricaoSubfuncao ?? null,
            descricao: e.descricao ?? null,
            valor_dotacao: parseBrNumber(e.valorDotacaoAtualizada),
            valor_empenhado: parseBrNumber(e.valorEmpenhado),
            valor_liquidado: parseBrNumber(e.valorLiquidado),
            valor_pago: parseBrNumber(e.valorPago),
            orgao_orcamentario: e.nomeOrgaoSuperior ?? e.nomeOrgao ?? null,
            municipio: e.nomeMunicipio ?? null,
            uf: e.siglaUf ?? null,
            payload: e,
          });
          upserted++;
        } catch (err: any) {
          this.logger.warn(`emenda upsert failed (${e.codigoEmenda}): ${err.message}`);
        }
      }
    }

    await this.cache.invalidate('emendas-orc:*');
    this.logger.log(`emendas ingestion done: ${upserted} upserted`);
    return { upserted };
  }
}
