-- ============================================================
-- 011_materialized_views.sql
-- FIX #21 (MÉDIO): Converte views pesadas para MATERIALIZED VIEWs
-- com índices. Requires: cron job para REFRESH periódico.
-- ============================================================

-- Nota: Este script é "CREATE OR REPLACE" safe — se já existem como views normais,
-- é necessário DROP VIEW primeiro. Execute com cuidado.

-- Produtividade por deputado
DROP VIEW IF EXISTS v_deputy_productivity CASCADE;
CREATE MATERIALIZED VIEW IF NOT EXISTS v_deputy_productivity AS
  SELECT
    pa.deputy_id,
    d.name,
    d.party,
    d.state,
    COUNT(DISTINCT pa.proposition_id)::int AS total_propositions,
    COUNT(DISTINCT pa.proposition_id) FILTER (WHERE pa.role = 'author')::int AS as_author,
    COUNT(DISTINCT pa.proposition_id) FILTER (WHERE pa.role = 'coauthor')::int AS as_coauthor,
    COUNT(DISTINCT pa.proposition_id) FILTER (WHERE pa.role = 'rapporteur')::int AS as_rapporteur
  FROM proposition_authors pa
  JOIN deputies d ON d.id = pa.deputy_id
  GROUP BY pa.deputy_id, d.name, d.party, d.state
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_deputy_prod_id ON v_deputy_productivity (deputy_id);
REFRESH MATERIALIZED VIEW v_deputy_productivity;

-- Taxa de aprovação por proposição
DROP VIEW IF EXISTS v_proposition_approval CASCADE;
CREATE MATERIALIZED VIEW IF NOT EXISTS v_proposition_approval AS
  SELECT
    p.id AS proposition_id,
    p.external_id,
    p.title,
    p.status,
    COUNT(v.id)::int AS total_votes,
    COUNT(v.id) FILTER (WHERE v.vote = 'Sim')::int AS yes_votes,
    COUNT(v.id) FILTER (WHERE v.vote = 'Não')::int AS no_votes,
    CASE WHEN COUNT(v.id) > 0
      THEN (COUNT(v.id) FILTER (WHERE v.vote = 'Sim')::numeric / COUNT(v.id) * 100)
      ELSE 0
    END AS approval_rate
  FROM propositions p
  LEFT JOIN votes v ON v.proposition_id = p.id
  GROUP BY p.id
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_prop_approval_id ON v_proposition_approval (proposition_id);
REFRESH MATERIALIZED VIEW v_proposition_approval;

-- Rede de coautoria (edges)
DROP VIEW IF EXISTS v_coauthorship_edges CASCADE;
CREATE MATERIALIZED VIEW IF NOT EXISTS v_coauthorship_edges AS
  SELECT
    pa1.deputy_id AS deputy_a,
    pa2.deputy_id AS deputy_b,
    COUNT(DISTINCT pa1.proposition_id)::int AS weight
  FROM proposition_authors pa1
  JOIN proposition_authors pa2
    ON pa1.proposition_id = pa2.proposition_id
    AND pa1.deputy_id < pa2.deputy_id
  GROUP BY pa1.deputy_id, pa2.deputy_id
  HAVING COUNT(DISTINCT pa1.proposition_id) >= 1
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_mv_coauth_a ON v_coauthorship_edges (deputy_a);
CREATE INDEX IF NOT EXISTS idx_mv_coauth_b ON v_coauthorship_edges (deputy_b);
REFRESH MATERIALIZED VIEW v_coauthorship_edges;

-- Breakdown de categorias
DROP VIEW IF EXISTS v_categories_breakdown CASCADE;
CREATE MATERIALIZED VIEW IF NOT EXISTS v_categories_breakdown AS
  SELECT
    c.slug,
    c.label,
    COUNT(DISTINCT pc.proposition_id)::int AS total,
    AVG(pc.score)::numeric(5,4) AS avg_score
  FROM categories c
  LEFT JOIN proposition_categories pc ON pc.category_id = c.id
  GROUP BY c.id, c.slug, c.label
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_catbreak_slug ON v_categories_breakdown (slug);
REFRESH MATERIALIZED VIEW v_categories_breakdown;

-- NOTA: Configure um cron para refresh periódico:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY v_deputy_productivity;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY v_proposition_approval;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY v_coauthorship_edges;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY v_categories_breakdown;
