-- ============================================================
-- 024_discursos_and_commissions_performance.sql
-- 1. Índice GIN de Full-Text Search para discursos parlamentares
-- 2. Índice composto para comissões da deputada (deputy_id, started_at DESC)
-- 3. Índice composto para membros de frentes parlamentares
-- ============================================================

-- 1. discursos: acelera pesquisas textuais (sumário e palavras-chave)
CREATE INDEX IF NOT EXISTS idx_discursos_fts
  ON discursos
  USING GIN (to_tsvector('portuguese', coalesce(keywords, '') || ' ' || coalesce(sumario, '')));

-- 2. deputy_commissions: otimiza listagem de comissões por data
CREATE INDEX IF NOT EXISTS idx_dc_deputy_started
  ON deputy_commissions (deputy_id, started_at DESC NULLS LAST);

-- 3. frente_membros: otimiza cruzamento de membros de frentes parlamentares
CREATE INDEX IF NOT EXISTS idx_fm_deputy_frente
  ON frente_membros (deputy_id, frente_id);
