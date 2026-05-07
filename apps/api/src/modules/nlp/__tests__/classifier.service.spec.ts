/**
 * FIX #23: Testes unitários para o ClassifierService melhorado (v2).
 * Cobre: FIX #14 — word boundaries, threshold, fallback.
 */

describe('ClassifierService (heuristic-v2)', () => {
  let service: any;

  beforeEach(async () => {
    jest.resetModules();
    const mockPool = { query: jest.fn() };
    const { ClassifierService } = await import('../../nlp/classifier.service');
    service = new ClassifierService(mockPool);
  });

  describe('classify()', () => {
    it('should return "outros" for empty input', () => {
      const result = service.classify('');
      expect(result).toEqual([{ slug: 'outros', score: 0 }]);
    });

    it('should return "outros" for very short input', () => {
      const result = service.classify('test');
      expect(result).toEqual([{ slug: 'outros', score: 0 }]);
    });

    it('should classify health-related text', () => {
      const result = service.classify('Projeto sobre saúde pública e hospital regional para vacinação');
      expect(result[0].slug).toBe('saude');
      expect(result[0].score).toBeGreaterThan(0);
    });

    it('should classify education-related text', () => {
      const result = service.classify('Dispõe sobre a educação infantil em creche e escola pública');
      expect(result[0].slug).toBe('educacao');
    });

    it('should classify rights-related text', () => {
      const result = service.classify('Estabelece medidas de igualdade de gênero e combate ao racismo e proteção à mulher');
      expect(result[0].slug).toBe('direitos');
    });

    it('FIX #14: should NOT match substring false positives (e.g. "educadamente")', () => {
      // "educadamente" should not match "educação" due to word boundary
      const result = service.classify('Falou educadamente sobre o assunto no plenário da câmara dos deputados federais');
      // Should NOT be classified as "educacao"
      const eduResult = result.find((r: any) => r.slug === 'educacao');
      expect(eduResult).toBeUndefined();
    });

    it('FIX #14: should filter below threshold', () => {
      // Text with many categories but one barely matching
      const result = service.classify('Projeto sobre saúde hospital vacina medicamento enfermagem escola');
      // All results should have score >= 0.15
      for (const r of result) {
        expect(r.score).toBeGreaterThanOrEqual(0.15);
      }
    });

    it('should handle multi-category text', () => {
      const result = service.classify('Projeto sobre saúde e educação no saneamento da universidade');
      expect(result.length).toBeGreaterThanOrEqual(2);
      // Should be sorted by score descending
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
      }
    });
  });
});
