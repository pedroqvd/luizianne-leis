-- ============================================================
-- 002_views.sql
-- Views materializáveis para analytics.
-- ============================================================

CREATE OR REPLACE VIEW v_deputy_productivity AS
SELECT
    d.id              AS deputy_id,
    d.external_id,
    d.name,
    COUNT(DISTINCT pa.proposition_id) FILTER (WHERE pa.role = 'author')      AS authored,
    COUNT(DISTINCT pa.proposition_id) FILTER (WHERE pa.role = 'coauthor')    AS coauthored,
    COUNT(DISTINCT pa.proposition_id) FILTER (WHERE pa.role = 'rapporteur')  AS rapporteured,
    COUNT(DISTINCT pa.proposition_id)                                        AS total_propositions
FROM deputies d
LEFT JOIN proposition_authors pa ON pa.deputy_id = d.id
GROUP BY d.id;

CREATE OR REPLACE VIEW v_proposition_approval AS
SELECT
    p.id                                                  AS proposition_id,
    p.external_id,
    p.title,
    p.status,
    COUNT(*) FILTER (WHERE v.vote = 'Sim')                AS yes_votes,
    COUNT(*) FILTER (WHERE v.vote = 'Nao')                AS no_votes,
    COUNT(*) FILTER (WHERE v.vote = 'Abstencao')          AS abstentions,
    COUNT(*) FILTER (WHERE v.vote = 'Obstrucao')          AS obstructions,
    COUNT(*)                                              AS total_votes,
    CASE WHEN COUNT(*) > 0
         THEN ROUND(100.0 * COUNT(*) FILTER (WHERE v.vote = 'Sim') / COUNT(*), 2)
         ELSE NULL END                                    AS approval_rate
FROM propositions p
LEFT JOIN votes v ON v.proposition_id = p.id
GROUP BY p.id;

-- Coautoria: pares de deputados que assinaram a mesma proposição
CREATE OR REPLACE VIEW v_coauthorship_edges AS
SELECT
    LEAST(a.deputy_id, b.deputy_id)        AS deputy_a,
    GREATEST(a.deputy_id, b.deputy_id)     AS deputy_b,
    COUNT(DISTINCT a.proposition_id)       AS weight
FROM proposition_authors a
JOIN proposition_authors b
  ON a.proposition_id = b.proposition_id
 AND a.deputy_id < b.deputy_id
GROUP BY 1, 2;
