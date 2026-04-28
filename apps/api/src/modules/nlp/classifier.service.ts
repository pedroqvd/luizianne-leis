import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';

/**
 * Classificador heurístico (lexical) para classificar proposições por área temática.
 *
 * Está plugável: o método `classify()` retorna scores normalizados; um classificador
 * baseado em modelo (transformer / spaCy / OpenAI) pode substituir essa implementação
 * sem alterar o contrato. O resultado é gravado em `proposition_categories` com a
 * coluna `classifier` identificando qual modelo gerou (permite rodar A/B).
 */
@Injectable()
export class ClassifierService {
  private readonly logger = new Logger(ClassifierService.name);
  private readonly classifierName = 'heuristic-v1';

  // Léxico por categoria — ajustado para vocabulário típico de proposições brasileiras.
  private readonly lexicon: Record<string, string[]> = {
    saude:          ['saúde', 'sus', 'hospital', 'medicament', 'vacin', 'atenção básica', 'enfermagem', 'sanitár'],
    educacao:       ['educa', 'escola', 'ensino', 'professor', 'universidad', 'fundeb', 'aluno', 'creche'],
    seguranca:      ['segurança', 'policial', 'polícia', 'violência', 'penitenciár', 'crime', 'arma'],
    economia:       ['imposto', 'tributár', 'salário', 'emprego', 'trabalh', 'micro empresa', 'pme', 'previdênc'],
    direitos:       ['mulher', 'racial', 'lgbt', 'igualdade', 'gênero', 'indígena', 'quilombol', 'idoso', 'pessoa com deficiên'],
    ambiente:       ['ambiente', 'desmatamento', 'amazônia', 'clima', 'sustentáv', 'saneamento', 'recurs hídric'],
    habitacao:      ['moradia', 'habitação', 'urbano', 'transport público', 'mobilidade urbana', 'minha casa'],
    cultura:        ['cultura', 'patrimôni', 'museu', 'rouanet', 'audiovisual'],
    infraestrutura: ['rodovia', 'ferrovia', 'energia', 'telecomunicaç', 'obra', 'porto', 'aeroporto'],
  };

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /**
   * Classifica um texto retornando scores [0, 1] por categoria.
   * Score = (matches da categoria) / (total de matches em todas categorias).
   */
  classify(text: string): Array<{ slug: string; score: number }> {
    const norm = (text ?? '').toLowerCase();
    if (!norm) return [];

    const counts: Record<string, number> = {};
    let total = 0;
    for (const [slug, terms] of Object.entries(this.lexicon)) {
      const c = terms.reduce((acc, t) => acc + (norm.includes(t) ? 1 : 0), 0);
      if (c > 0) {
        counts[slug] = c;
        total += c;
      }
    }
    if (total === 0) return [{ slug: 'outros', score: 1 }];

    return Object.entries(counts)
      .map(([slug, c]) => ({ slug, score: Number((c / total).toFixed(4)) }))
      .sort((a, b) => b.score - a.score);
  }

  async classifyAndPersist(propositionId: number, text: string): Promise<number> {
    const scores = this.classify(text);
    if (!scores.length) return 0;

    let saved = 0;
    for (const { slug, score } of scores) {
      const { rowCount } = await this.pool.query(
        `INSERT INTO proposition_categories (proposition_id, category_id, score, classifier, classified_at)
         SELECT $1, c.id, $2, $3, now() FROM categories c WHERE c.slug = $4
         ON CONFLICT (proposition_id, category_id, classifier) DO UPDATE
           SET score = EXCLUDED.score, classified_at = now()`,
        [propositionId, score, this.classifierName, slug],
      );
      saved += rowCount ?? 0;
    }
    return saved;
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
    for (const r of rows) {
      const text = `${r.title ?? ''} ${r.summary ?? ''}`;
      await this.classifyAndPersist(r.id, text);
      processed++;
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
