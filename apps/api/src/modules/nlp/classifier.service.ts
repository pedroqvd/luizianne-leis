import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';

/**
 * Classificador heurístico (lexical) para classificar proposições por área temática.
 *
 * FIX #14 (MÉDIO): Melhorias no classificador:
 *   - Termos agora usam word boundaries (regex) em vez de substring match
 *   - Score mínimo threshold para evitar classificações de baixa confiança
 *   - Fallback 'outros' com score 0 (baixa confiança) em vez de 1.0
 *   - Termos expandidos para maior cobertura
 */
@Injectable()
export class ClassifierService {
  private readonly logger = new Logger(ClassifierService.name);
  private readonly classifierName = 'heuristic-v2';
  private readonly minScore = 0.15; // FIX #14: Threshold mínimo para classificação

  // Léxico por categoria — termos como regex patterns com word boundaries
  private readonly lexicon: Record<string, RegExp[]> = {
    saude:          this.buildPatterns(['saúde', 'saude', 'sus\\b', 'hospital', 'medicamento', 'vacina', 'atenção básica', 'enfermagem', 'sanitário', 'sanitária', 'epidemia', 'pandemia', 'ubs\\b', 'farmácia']),
    educacao:       this.buildPatterns(['educação', 'educacao', 'escola', 'ensino', 'professor', 'universidade', 'fundeb', 'aluno', 'creche', 'pedagog', 'docente', 'enem\\b', 'letramento']),
    seguranca:      this.buildPatterns(['segurança', 'seguranca', 'policial', 'polícia', 'policia', 'violência', 'violencia', 'penitenciário', 'crime', 'armamento', 'feminicídio', 'tráfico']),
    economia:       this.buildPatterns(['imposto', 'tributário', 'tributaria', 'salário', 'salario', 'emprego', 'trabalho', 'microempresa', 'previdência', 'previdencia', 'pme\\b', 'fiscal', 'inflação']),
    direitos:       this.buildPatterns(['mulher', 'racial', 'lgbtq', 'igualdade', 'gênero', 'genero', 'indígena', 'indigena', 'quilombola', 'idoso', 'pessoa com deficiência', 'acessibilidade', 'inclusão']),
    ambiente:       this.buildPatterns(['meio ambiente', 'desmatamento', 'amazônia', 'amazonia', 'clima', 'sustentável', 'sustentavel', 'saneamento', 'recursos hídricos', 'poluição', 'fauna', 'flora']),
    habitacao:      this.buildPatterns(['moradia', 'habitação', 'habitacao', 'urbanismo', 'transporte público', 'mobilidade urbana', 'minha casa', 'sem-teto', 'aluguel social']),
    cultura:        this.buildPatterns(['cultura', 'cultural', 'patrimônio', 'patrimonio', 'museu', 'rouanet', 'audiovisual', 'artístico', 'biblioteca']),
    infraestrutura: this.buildPatterns(['rodovia', 'ferrovia', 'energia', 'telecomunicação', 'telecomunicacao', 'obra pública', 'porto\\b', 'aeroporto', 'saneamento básico', 'eletrificação']),
  };

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private buildPatterns(terms: string[]): RegExp[] {
    return terms.map((t) => new RegExp(`\\b${t}`, 'i'));
  }

  /**
   * Classifica um texto retornando scores [0, 1] por categoria.
   * FIX #14: Agora usa regex com word boundaries e threshold mínimo.
   */
  classify(text: string): Array<{ slug: string; score: number }> {
    const norm = (text ?? '').toLowerCase();
    if (!norm || norm.length < 10) return [{ slug: 'outros', score: 0 }];

    const counts: Record<string, number> = {};
    let total = 0;
    for (const [slug, patterns] of Object.entries(this.lexicon)) {
      const c = patterns.reduce((acc, p) => acc + (p.test(norm) ? 1 : 0), 0);
      if (c > 0) {
        counts[slug] = c;
        total += c;
      }
    }

    // FIX #14: Fallback 'outros' com score 0 (baixa confiança)
    if (total === 0) return [{ slug: 'outros', score: 0 }];

    return Object.entries(counts)
      .map(([slug, c]) => ({ slug, score: Number((c / total).toFixed(4)) }))
      .filter(({ score }) => score >= this.minScore) // FIX #14: threshold
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Classifica e persiste de forma atômica para múltiplas proposições (Bulk Insert)
   * FIX #1 (CRÍTICO): Evita problema de N+1 queries gerando I/O bloqueante.
   */
  async classifyAndPersistBulk(propositions: Array<{ id: number; text: string }>): Promise<number> {
    const entries: Array<{ propId: number; slug: string; score: number }> = [];

    for (const p of propositions) {
      const scores = this.classify(p.text);
      for (const { slug, score } of scores) {
        entries.push({ propId: p.id, slug, score });
      }
    }

    if (entries.length === 0) return 0;

    // Build parameterized VALUES clauses safely
    const valueClauses: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const entry of entries) {
      valueClauses.push(
        `($${idx}, (SELECT id FROM categories WHERE slug = $${idx + 1}), $${idx + 2}, $${idx + 3}, now())`,
      );
      params.push(entry.propId, entry.slug, entry.score, this.classifierName);
      idx += 4;
    }

    const { rowCount } = await this.pool.query(
      `INSERT INTO proposition_categories (proposition_id, category_id, score, classifier, classified_at)
       VALUES ${valueClauses.join(', ')}
       ON CONFLICT (proposition_id, category_id, classifier) DO UPDATE
         SET score = EXCLUDED.score, classified_at = now()`,
      params,
    );
    return rowCount ?? 0;
  }

  async classifyAndPersist(propositionId: number, text: string): Promise<number> {
    return this.classifyAndPersistBulk([{ id: propositionId, text }]);
  }

  /**
   * Reclassifica todas as proposições sem classificação (ou força reclassificação).
   * Útil após atualizar o léxico.
   */
  async reclassifyAll(force = false): Promise<{ processed: number }> {
    const sql = force
      ? `SELECT id, title, summary FROM propositions`
      : `SELECT p.id, p.title, p.summary
           FROM propositions p
           LEFT JOIN proposition_categories pc
             ON pc.proposition_id = p.id AND pc.classifier = $1
          WHERE pc.proposition_id IS NULL`;
    const params = force ? [] : [this.classifierName];
    const { rows } = await this.pool.query(sql, params);

    let processed = 0;
    const batchSize = 1000;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map(r => ({
        id: r.id,
        text: `${r.title ?? ''} ${r.summary ?? ''}`,
      }));
      await this.classifyAndPersistBulk(batch);
      processed += batch.length;
    }
    this.logger.log(`reclassified ${processed} propositions`);
    return { processed };
  }

  async breakdown() {
    const { rows } = await this.pool.query(
      `SELECT * FROM v_categories_breakdown WHERE total > 0 ORDER BY total DESC`,
    );
    return rows;
  }
}
