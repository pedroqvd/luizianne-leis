import { extractDeputyIdFromUri, mapAuthorRole } from './camara-api.client';

describe('extractDeputyIdFromUri', () => {
  it('extrai id de URL de deputado', () => {
    expect(
      extractDeputyIdFromUri('https://dadosabertos.camara.leg.br/api/v2/deputados/141401'),
    ).toBe(141401);
  });

  it('retorna null para URL de comissão/órgão', () => {
    expect(
      extractDeputyIdFromUri('https://dadosabertos.camara.leg.br/api/v2/orgaos/2007'),
    ).toBeNull();
  });

  it('retorna null para input vazio/undefined', () => {
    expect(extractDeputyIdFromUri(undefined)).toBeNull();
    expect(extractDeputyIdFromUri('')).toBeNull();
  });

  it('extrai id de URL com query string', () => {
    expect(
      extractDeputyIdFromUri('https://dadosabertos.camara.leg.br/api/v2/deputados/220714?foo=1'),
    ).toBe(220714);
  });
});

describe('mapAuthorRole', () => {
  it('detecta relator a partir do tipo', () => {
    expect(mapAuthorRole('Relator', 0, 5)).toBe('rapporteur');
    expect(mapAuthorRole('relator-substituto', 0, 5)).toBe('rapporteur');
  });

  it('detecta autor principal por proponente=1', () => {
    expect(mapAuthorRole('Deputado', 1, 1)).toBe('author');
  });

  it('detecta autor principal por ordemAssinatura=1', () => {
    expect(mapAuthorRole('Deputado', 0, 1)).toBe('author');
  });

  it('cai em coauthor por padrão', () => {
    expect(mapAuthorRole('Deputado', 0, 5)).toBe('coauthor');
  });

  it('relator tem precedência sobre proponente', () => {
    expect(mapAuthorRole('Relator', 1, 1)).toBe('rapporteur');
  });

  it('lida com tipo undefined', () => {
    expect(mapAuthorRole(undefined, 1, 1)).toBe('author');
    expect(mapAuthorRole(undefined, 0, 5)).toBe('coauthor');
  });
});
