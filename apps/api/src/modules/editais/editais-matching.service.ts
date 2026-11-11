import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../infra/database/database.module';

export interface MatchComputationResult {
  evaluatedEditais: number;
  evaluatedAuthorities: number;
  matchesUpserted: number;
}

interface EditalCandidate {
  id: number;
  titulo: string;
  objeto: string | null;
  orgao: string;
  ministerio: string;
  uf: string | null;
  municipio: string | null;
  valor_estimado: string | number | null;
  categoria_tematica: string | null;
  keywords_extraidas: string[] | null;
  elegivel_prefeituras: boolean | null;
  abrangencia: string | null;
}

interface AuthorityCandidate {
  id: string;
  name: string;
  role: string;
  municipality_name: string;
  macro_region: string | null;
  allied_status: string;
  priority_areas: string[] | null;
}

interface DemandCandidate {
  id: string;
  authority_id: string;
  title: string;
  description: string | null;
  category: string;
  keywords: string[] | null;
  estimated_value: string | number | null;
  urgency: string;
  target_ministry: string | null;
}

const STOPWORDS = new Set([
  'para', 'como', 'mais', 'pela', 'pelo', 'pelos', 'pelas', 'este', 'esta',
  'isso', 'aquele', 'aquela', 'entre', 'sobre', 'apos', 'ante', 'contra',
  'desde', 'perante', 'segundo', 'conforme', 'mediante', 'durante', 'municipio',
  'prefeitura', 'ceara', 'estado', 'federal', 'nacional', 'servico', 'servicos',
  'aquisicao', 'contratacao', 'empresa', 'especializada', 'fornecimento',
  'registro', 'precos', 'futura', 'eventual', 'atender', 'necessidades',
  'secretaria', 'ministerio', 'programa', 'projeto', 'implantacao', 'execucao',
]);

function normalize(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function extractTokens(text: string): string[] {
  const norm = normalize(text);
  return norm
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));
}

@Injectable()
export class EditaisMatchingService {
  private readonly logger = new Logger(EditaisMatchingService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /**
   * Cruza editais abertos com prefeitos/lideranças ativas e sua carteira de demandas,
   * calculando score de aderência (0–100) e razões explicáveis.
   */
  async recomputeMatches(options?: {
    editalId?: number;
    authorityId?: string;
  }): Promise<MatchComputationResult> {
    const editalParams: any[] = [];
    let editalWhere = `WHERE situacao = 'aberto'`;
    if (options?.editalId) {
      editalParams.push(options.editalId);
      editalWhere += ` AND id = $1`;
    }

    const authParams: any[] = [];
    let authWhere = `WHERE a.active = true`;
    if (options?.authorityId) {
      authParams.push(options.authorityId);
      authWhere += ` AND a.id = $1`;
    }

    const [editaisRes, authRes, demandsRes] = await Promise.all([
      this.pool.query<EditalCandidate>(
        `SELECT id, titulo, objeto, orgao, ministerio, uf, municipio,
                valor_estimado, categoria_tematica, keywords_extraidas,
                elegivel_prefeituras, abrangencia
           FROM editais
           ${editalWhere}
           ORDER BY data_proposta_fim ASC NULLS LAST
           LIMIT 1000`,
        editalParams,
      ),
      this.pool.query<AuthorityCandidate>(
        `SELECT a.id, a.name, a.role,
                COALESCE(m.name, a.municipality_name) AS municipality_name,
                COALESCE(m.macro_region, a.macro_region) AS macro_region,
                a.allied_status, a.priority_areas
           FROM municipal_authorities a
           LEFT JOIN ceara_municipalities m ON (m.id = a.municipality_id OR m.ibge_code = a.municipality_ibge)
           ${authWhere}`,
        authParams,
      ),
      this.pool.query<DemandCandidate>(
        `SELECT id, authority_id, title, description, category,
                keywords, estimated_value, urgency, target_ministry
           FROM authority_demands
           WHERE status NOT IN ('atendida', 'arquivada')
           ${options?.authorityId ? 'AND authority_id = $1' : ''}`,
        authParams,
      ),
    ]);

    const editais = editaisRes.rows;
    const authorities = authRes.rows;
    const demandsByAuthority = new Map<string, DemandCandidate[]>();

    for (const d of demandsRes.rows) {
      const list = demandsByAuthority.get(d.authority_id) ?? [];
      list.push(d);
      demandsByAuthority.set(d.authority_id, list);
    }

    if (!editais.length || !authorities.length) {
      return {
        evaluatedEditais: editais.length,
        evaluatedAuthorities: authorities.length,
        matchesUpserted: 0,
      };
    }

    const toUpsert: Array<{
      edital_id: number;
      authority_id: string;
      demand_id: string | null;
      match_score: number;
      match_reasons: string[];
    }> = [];

    for (const edital of editais) {
      const editalCorpus = normalize(
        [
          edital.titulo,
          edital.objeto ?? '',
          edital.orgao,
          edital.ministerio,
          ...(edital.keywords_extraidas ?? []),
        ].join(' '),
      );
      const editalCat = normalize(edital.categoria_tematica);
      const editalOrg = normalize(`${edital.ministerio} ${edital.orgao}`);
      const isStrategicAgency =
        editalOrg.includes('codevasf') ||
        editalOrg.includes('dnocs') ||
        editalOrg.includes('sudene') ||
        editalOrg.includes('fnde') ||
        editalOrg.includes('fundo nacional de saude') ||
        editalOrg.includes('incra');

      for (const auth of authorities) {
        const authDemands = demandsByAuthority.get(auth.id) ?? [];
        const authPriorityNorm = (auth.priority_areas ?? []).map(normalize);

        let bestScore = 0;
        let bestReasons: string[] = [];
        let bestDemandId: string | null = null;

        // 1. Avalia aderência com cada demanda específica cadastrada para o prefeito
        for (const dem of authDemands) {
          let score = 0;
          const reasons: string[] = [];
          const demCat = normalize(dem.category);

          // (A) Categoria temática (até 35 pts)
          if (demCat && editalCat && demCat === editalCat) {
            score += 35;
            reasons.push(`Mesma área temática da demanda (${dem.category})`);
          } else if (editalCat && authPriorityNorm.includes(editalCat)) {
            score += 20;
            reasons.push(`Área prioritária do município (${edital.categoria_tematica})`);
          }

          // (B) Palavras-chave e sobreposição semântica (até 30 pts)
          const demTokens = new Set([
            ...extractTokens(`${dem.title} ${dem.description ?? ''}`),
            ...(dem.keywords ?? []).map(normalize).filter((k) => k.length >= 3),
          ]);
          const matchedTerms: string[] = [];
          for (const token of demTokens) {
            if (token && editalCorpus.includes(token)) {
              matchedTerms.push(token);
            }
          }
          if (matchedTerms.length > 0) {
            const kwPoints = Math.min(30, matchedTerms.length * 9);
            score += kwPoints;
            reasons.push(`Termos compatíveis: ${matchedTerms.slice(0, 4).join(', ')}`);
          }

          // (C) Ministério / Órgão alvo (até 15 pts)
          const targetMin = normalize(dem.target_ministry);
          if (targetMin && editalOrg.includes(targetMin)) {
            score += 15;
            reasons.push(`Órgão concedente compatível (${edital.ministerio})`);
          } else if (isStrategicAgency) {
            score += 8;
            reasons.push(`Órgão federal estratégico para municípios`);
          }

          // (D) Elegibilidade geográfica e municipal (até 10 pts)
          const authMunNorm = normalize(auth.municipality_name);
          const editalMunNorm = normalize(edital.municipio);
          if (edital.uf === 'CE' && editalMunNorm && editalMunNorm === authMunNorm) {
            score += 10;
            reasons.push(`Execução direta em ${auth.municipality_name}/CE`);
          } else if (edital.uf === 'CE' || edital.abrangencia === 'CE') {
            score += 8;
            reasons.push(`Edital com abrangência no Ceará`);
          } else if (edital.elegivel_prefeituras) {
            score += 6;
            reasons.push(`Elegível para prefeituras / adesão municipal`);
          }

          // (E) Urgência e porte financeiro (até 10 pts)
          if (dem.urgency === 'critica') {
            score += 6;
            reasons.push(`Demanda municipal de urgência crítica`);
          } else if (dem.urgency === 'alta') {
            score += 4;
          }

          const demVal = Number(dem.estimated_value ?? 0);
          const edVal = Number(edital.valor_estimado ?? 0);
          if (demVal > 0 && edVal > 0) {
            const ratio = edVal / demVal;
            if (ratio >= 0.1 && ratio <= 25) {
              score += 4;
              reasons.push(`Porte financeiro compatível`);
            }
          }

          const finalScore = Math.min(100, Math.round(score));
          if (finalScore > bestScore) {
            bestScore = finalScore;
            bestReasons = reasons;
            bestDemandId = dem.id;
          }
        }

        // 2. Caso não haja demanda específica com match >= 40, verifica aderência direta ao perfil prioritário do prefeito
        if (bestScore < 40 && editalCat && authPriorityNorm.includes(editalCat)) {
          let profileScore = 30;
          const profileReasons = [`Área prioritária do prefeito (${edital.categoria_tematica})`];

          const authMunNorm = normalize(auth.municipality_name);
          const editalMunNorm = normalize(edital.municipio);
          if (edital.uf === 'CE' && editalMunNorm && editalMunNorm === authMunNorm) {
            profileScore += 25;
            profileReasons.push(`Edital localizado em ${auth.municipality_name}/CE`);
          } else if (edital.uf === 'CE' || edital.abrangencia === 'CE') {
            profileScore += 15;
            profileReasons.push(`Oportunidade direta no estado do Ceará`);
          } else if (edital.elegivel_prefeituras && isStrategicAgency) {
            profileScore += 18;
            profileReasons.push(`Órgão federal estratégico com elegibilidade municipal`);
          }

          if (profileScore >= 48 && profileScore > bestScore) {
            bestScore = Math.min(100, profileScore);
            bestReasons = profileReasons;
            bestDemandId = null;
          }
        }

        if (bestScore >= 40) {
          toUpsert.push({
            edital_id: edital.id,
            authority_id: auth.id,
            demand_id: bestDemandId,
            match_score: bestScore,
            match_reasons: bestReasons,
          });
        }
      }
    }

    let matchesUpserted = 0;
    const chunkSize = 100;
    for (let i = 0; i < toUpsert.length; i += chunkSize) {
      const chunk = toUpsert.slice(i, i + chunkSize);
      const values: any[] = [];
      const placeholders: string[] = [];
      let p = 1;

      for (const row of chunk) {
        placeholders.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}::jsonb, 'sugerido', NOW())`);
        values.push(
          row.edital_id,
          row.authority_id,
          row.demand_id,
          row.match_score,
          JSON.stringify(row.match_reasons ?? []),
        );
      }

      const { rowCount } = await this.pool.query(
        `INSERT INTO edital_authority_tracking (
           edital_id, authority_id, demand_id, match_score, match_reasons, tracking_status, updated_at
         ) VALUES ${placeholders.join(', ')}
         ON CONFLICT (edital_id, authority_id) DO UPDATE SET
           demand_id     = COALESCE(edital_authority_tracking.demand_id, EXCLUDED.demand_id),
           match_score   = GREATEST(edital_authority_tracking.match_score, EXCLUDED.match_score),
           match_reasons = EXCLUDED.match_reasons,
           updated_at    = NOW()`,
        values,
      );
      matchesUpserted += rowCount ?? chunk.length;
    }

    this.logger.log(
      `Matchmaking recomputed: ${editais.length} editais x ${authorities.length} authorities -> ${matchesUpserted} matches upserted`,
    );

    return {
      evaluatedEditais: editais.length,
      evaluatedAuthorities: authorities.length,
      matchesUpserted,
    };
  }

  /**
   * Lista prefeitos e demandas compatíveis para um edital específico.
   */
  async listMatchesForEdital(editalId: number) {
    const { rows } = await this.pool.query(
      `SELECT
         t.id,
         t.edital_id,
         t.authority_id,
         t.demand_id,
         t.match_score,
         t.match_reasons,
         t.tracking_status,
         t.notified_at,
         t.notified_by,
         t.protocol_submitted,
         t.notes,
         t.updated_at,
         a.name AS authority_name,
         a.role AS authority_role,
         a.party AS authority_party,
         a.allied_status,
         a.whatsapp AS authority_whatsapp,
         a.phone AS authority_phone,
         a.email AS authority_email,
         COALESCE(m.name, a.municipality_name) AS municipality_name,
         COALESCE(m.macro_region, a.macro_region) AS macro_region,
         d.title AS demand_title,
         d.category AS demand_category,
         d.estimated_value AS demand_estimated_value,
         d.urgency AS demand_urgency
       FROM edital_authority_tracking t
       JOIN municipal_authorities a ON a.id = t.authority_id
       LEFT JOIN ceara_municipalities m ON (m.id = a.municipality_id OR m.ibge_code = a.municipality_ibge)
       LEFT JOIN authority_demands d ON d.id = t.demand_id
       WHERE t.edital_id = $1
       ORDER BY t.match_score DESC, COALESCE(m.name, a.municipality_name) ASC`,
      [editalId],
    );
    return rows;
  }
}
