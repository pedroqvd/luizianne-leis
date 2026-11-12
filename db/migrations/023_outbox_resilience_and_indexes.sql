-- ============================================================
-- 023_outbox_resilience_and_indexes.sql
-- 1. Resiliência do Outbox contra poison-pills (dead-letter logic)
-- 2. Índice parcial para fila de outbox não processada
-- 3. Índice em edital_authority_tracking (match_score DESC)
-- 4. Índice parcial em demands ativas para lembrete semanal
-- ============================================================

-- 1. Adiciona colunas para rastreamento de tentativas e último erro na outbox_events
ALTER TABLE outbox_events ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0;
ALTER TABLE outbox_events ADD COLUMN IF NOT EXISTS last_error TEXT NULL;

-- 2. Índice para acelerar a busca de eventos pendentes na fila por ordem de ID
CREATE INDEX IF NOT EXISTS idx_outbox_unprocessed_id
  ON outbox_events (id ASC)
  WHERE processed_at IS NULL;

-- 3. Índice em edital_authority_tracking para eliminar filesort na ordenação de match_score
CREATE INDEX IF NOT EXISTS idx_edital_auth_track_score
  ON edital_authority_tracking (match_score DESC);

-- 4. Índice em demands para otimizar busca de demandas ativas e vencidas
CREATE INDEX IF NOT EXISTS idx_demands_active
  ON demands (status, due_date ASC NULLS LAST)
  WHERE status NOT IN ('resolvido', 'arquivado');
