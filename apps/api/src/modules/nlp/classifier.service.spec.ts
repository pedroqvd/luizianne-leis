import { ClassifierService } from './classifier.service';

describe('ClassifierService.classify', () => {
  // Pool não é usado em classify(), então passamos um mock vazio.
  const svc = new ClassifierService({} as any);

  it('classifica texto de saúde com score positivo', () => {
    const result = svc.classify('Cria diretrizes para o atendimento do SUS em hospitais públicos');
    expect(result[0].slug).toBe('saude');
    expect(result[0].score).toBeGreaterThan(0);
  });

  it('classifica texto de educação', () => {
    const result = svc.classify('Aumenta o repasse do FUNDEB para escolas de ensino fundamental');
    expect(result[0].slug).toBe('educacao');
  });

  it('cai em "outros" quando não há matches', () => {
    const result = svc.classify('Texto completamente neutro xyz');
    expect(result[0].slug).toBe('outros');
    expect(result[0].score).toBe(1);
  });

  it('soma dos scores ~ 1', () => {
    const result = svc.classify('SUS hospital escola universitária moradia popular');
    const sum = result.reduce((acc, r) => acc + r.score, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(0.01);
  });

  it('retorna scores ordenados decrescente', () => {
    const result = svc.classify('SUS SUS SUS SUS hospital escola');
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    }
  });
});
