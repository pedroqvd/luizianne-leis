import {
  parsePncpControlId,
  buildPncpUrl,
  classifyEditalTheme,
  deriveMunicipalEligibility,
  pncpToInternal,
  type PncpItem,
} from '../pncp-api.client';
import { EditaisMatchingService } from '../editais-matching.service';

describe('PNCP Client & Deep Enrichment', () => {
  it('parses numeroControlePNCP and builds exact PNCP edital URL', () => {
    const parsed = parsePncpControlId('00394544000185-1-000123/2026');
    expect(parsed).toEqual({
      cnpj: '00394544000185',
      sequencial: '123',
      ano: '2026',
    });

    const item: PncpItem = {
      numeroControlePNCP: '00394544000185-1-000123/2026',
      numeroCompra: '000123',
      anoCompra: 2026,
      modalidadeId: 6,
      modalidadeNome: 'Pregão - Eletrônico',
      situacaoCompraId: 1,
      situacaoCompraNome: 'Divulgada no PNCP',
      objetoCompra: 'Aquisição de ambulâncias SAMU e equipamentos para UBS municipais no Ceará',
      orgaoEntidade: {
        cnpj: '00.394.544/0001-85',
        razaoSocial: 'MINISTERIO DA SAUDE',
        poderId: 'E',
        esferaId: 'F',
      },
      unidadeOrgao: {
        codigoUnidade: '250005',
        nomeUnidade: 'SUPERINTENDENCIA ESTADUAL DO MS NO CEARA',
        ufSigla: 'CE',
        municipioNome: 'Fortaleza',
      },
    };

    expect(buildPncpUrl(item)).toBe(
      'https://pncp.gov.br/app/editais/00394544000185/2026/123',
    );

    const internal = pncpToInternal(item);
    expect(internal.ministerio).toBe('Ministério da Saúde');
    expect(internal.ministerio_slug).toBe('saude');
    expect(internal.ministerio_sigla).toBe('MS');
    expect(internal.unidade_nome).toBe('SUPERINTENDENCIA ESTADUAL DO MS NO CEARA');
    expect(internal.categoria_tematica).toBe('saúde');
    expect(internal.elegivel_prefeituras).toBe(true);
    expect(internal.abrangencia).toBe('CE');
    expect(internal.keywords_extraidas).toEqual(
      expect.arrayContaining(['ubs', 'ambulancia', 'samu', 'saude']),
    );
  });

  it('classifies infrastructure and water resources themes accurately', () => {
    const infra = classifyEditalTheme(
      'Obras de pavimentação asfáltica e drenagem urbana em estradas vicinais',
    );
    expect(infra.categoria_tematica).toBe('infraestrutura');

    const hidrico = classifyEditalTheme(
      'Implantação de adutora, perfuração de poço profundo e dessalinizador pelo DNOCS',
    );
    expect(hidrico.categoria_tematica).toBe('recursos hídricos');
  });

  it('derives municipal eligibility for SRP and regional agencies', () => {
    const srpItem: PncpItem = {
      numeroControlePNCP: '00394544000185-1-000045/2026',
      numeroCompra: '45',
      anoCompra: 2026,
      modalidadeId: 6,
      modalidadeNome: 'Pregão',
      situacaoCompraId: 1,
      situacaoCompraNome: 'Divulgada',
      objetoCompra: 'Registro de preços para aquisição de ônibus escolar rural FNDE',
      srp: true,
      orgaoEntidade: { razaoSocial: 'FUNDO NACIONAL DE DESENVOLVIMENTO DA EDUCACAO', esferaId: 'F' },
      unidadeOrgao: { ufSigla: 'DF' },
    };

    const elig = deriveMunicipalEligibility(srpItem, 'educação');
    expect(elig.elegivel_prefeituras).toBe(true);
    expect(elig.publico_alvo).toEqual(
      expect.arrayContaining(['prefeituras', 'adesao_ata_srp']),
    );

    const fndeInternal = pncpToInternal(srpItem);
    expect(fndeInternal.ministerio).toBe('Ministério da Educação');
    expect(fndeInternal.ministerio_slug).toBe('educacao');
    expect(fndeInternal.ministerio_sigla).toBe('MEC');
    expect(fndeInternal.autarquia).toBe('FNDE — Fundo Nacional de Desenvolvimento da Educação');
  });
});

describe('EditaisMatchingService', () => {
  it('computes high match score between an open health edital and a mayor UBS/ambulance demand', async () => {
    const queryMock = jest.fn();
    // 1st call: open editais
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 101,
          titulo: 'Seleção de propostas para construção de UBS e aquisição de ambulância SAMU',
          objeto: 'Apoio financeiro a municípios do Ceará para atenção básica e UBS',
          orgao: 'MINISTERIO DA SAUDE',
          ministerio: 'MINISTERIO DA SAUDE',
          uf: 'CE',
          municipio: 'Sobral',
          valor_estimado: 2500000,
          categoria_tematica: 'saúde',
          keywords_extraidas: ['ubs', 'ambulancia', 'samu', 'saude'],
          elegivel_prefeituras: true,
          abrangencia: 'CE',
        },
      ],
    });
    // 2nd call: active authorities
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 'auth-uuid-1',
          name: 'Prefeito Aliado',
          role: 'prefeito',
          municipality_name: 'Sobral',
          macro_region: 'Sertão de Sobral',
          allied_status: 'aliado_base_elmano',
          priority_areas: ['saúde', 'educação'],
        },
      ],
    });
    // 3rd call: open demands
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 'dem-uuid-1',
          authority_id: 'auth-uuid-1',
          title: 'Construção de UBS no distrito e nova ambulância SAMU',
          description: 'Demanda urgente de saúde básica',
          category: 'saúde',
          keywords: ['ubs', 'ambulancia', 'samu'],
          estimated_value: 2000000,
          urgency: 'critica',
          target_ministry: 'Ministério da Saúde',
        },
      ],
    });
    // 4th call: upsert into edital_authority_tracking
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    const service = new EditaisMatchingService({ query: queryMock } as any);
    const res = await service.recomputeMatches();

    expect(res.evaluatedEditais).toBe(1);
    expect(res.evaluatedAuthorities).toBe(1);
    expect(res.matchesUpserted).toBe(1);

    const insertCall = queryMock.mock.calls[3];
    expect(insertCall[0]).toContain('INSERT INTO edital_authority_tracking');
    const params = insertCall[1];
    expect(params[0]).toBe(101);
    expect(params[1]).toBe('auth-uuid-1');
    expect(params[2]).toBe('dem-uuid-1');
    expect(params[3]).toBeGreaterThanOrEqual(85);
  });
});
