-- ============================================================
-- 007_absence_votes.sql
-- Rastreamento de ausências em votações nominais.
-- ============================================================

-- Flag que distingue voto real de ausência detectada pelo tracker
ALTER TABLE votes ADD COLUMN IF NOT EXISTS is_absence boolean NOT NULL DEFAULT false;

-- Índice para queries de ausência por data
CREATE INDEX IF NOT EXISTS idx_votes_absence
  ON votes (is_absence, date DESC)
  WHERE is_absence = true;

-- Área de notificação para ausências (opt-in)
INSERT INTO notification_areas (slug, label, description)
VALUES (
  'ausencias',
  'Ausências em Votações',
  'Alerta quando a deputada não registra voto em votação nominal'
)
ON CONFLICT (slug) DO NOTHING;
