-- ============================================================
-- 012_maintenance_indexes.sql
-- FIX D1 (MÉDIO): Purge de system_events antigos
-- FIX D2 (MÉDIO): Índice para votes.is_absence
-- ============================================================

-- FIX D2: Índice parcial para queries que filtram is_absence = true
-- Usado em: VoteRepository.listByDeputy, list, stats
CREATE INDEX IF NOT EXISTS idx_votes_absence
  ON votes (deputy_id, is_absence)
  WHERE is_absence = true;

-- Índice para system_events por data (para purge eficiente)
CREATE INDEX IF NOT EXISTS idx_system_events_created_at
  ON system_events (created_at);

-- FIX D1: Função para purge de eventos antigos (chamada via cron)
-- Retorna o número de linhas deletadas
CREATE OR REPLACE FUNCTION purge_old_events(retention_days INT DEFAULT 90)
RETURNS INT AS $$
DECLARE
  deleted INT;
BEGIN
  DELETE FROM system_events
   WHERE created_at < NOW() - (retention_days * INTERVAL '1 day');
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$ LANGUAGE plpgsql;

-- Configurar pg_cron (se disponível) — Supabase free tier tem pg_cron habilitado
-- Purge diário à 1h da manhã mantendo 90 dias de histórico
-- SELECT cron.schedule('purge-old-events', '0 1 * * *', 'SELECT purge_old_events(90)');

-- Para executar manualmente:
-- SELECT purge_old_events(90);

-- ============================================================
-- Índices adicionais de performance identificados na auditoria
-- ============================================================

-- Índice para propositions.presented_at (usado no heatmap analytics)
CREATE INDEX IF NOT EXISTS idx_propositions_presented_at
  ON propositions (presented_at)
  WHERE presented_at IS NOT NULL;

-- Índice para editais.situacao + data (usado em list e stats)
CREATE INDEX IF NOT EXISTS idx_editais_situacao_proposta_fim
  ON editais (situacao, data_proposta_fim);
