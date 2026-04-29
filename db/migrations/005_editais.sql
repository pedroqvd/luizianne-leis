-- ============================================================
-- 005_editais.sql
-- Adiciona área de notificação "Editais" e tabela para
-- acompanhamento de editais abertos nos ministérios.
-- ============================================================

-- Nova área de notificação
INSERT INTO notification_areas (slug, label, description) VALUES
  ('editais', 'Editais', 'Abertura de editais nos ministérios e órgãos federais')
ON CONFLICT (slug) DO NOTHING;

-- Cria subscrições para todos os usuários existentes (disabled por padrão)
INSERT INTO user_subscriptions (user_id, area_id, enabled)
SELECT u.id, a.id, false
FROM app_users u
CROSS JOIN notification_areas a
WHERE a.slug = 'editais'
ON CONFLICT (user_id, area_id) DO NOTHING;

-- Tabela para armazenar editais rastreados
CREATE TABLE IF NOT EXISTS editais (
  id            SERIAL      PRIMARY KEY,
  titulo        TEXT        NOT NULL,
  orgao         TEXT        NOT NULL,
  ministerio    TEXT        NOT NULL,
  numero        TEXT,
  objeto        TEXT,
  modalidade    TEXT,           -- 'pregao', 'concorrencia', 'chamamento', 'credenciamento', etc.
  valor_estimado NUMERIC(15,2),
  data_abertura  DATE,
  data_encerramento DATE,
  situacao      TEXT        NOT NULL DEFAULT 'aberto', -- 'aberto' | 'encerrado' | 'suspenso' | 'revogado'
  url_fonte     TEXT,
  url_edital    TEXT,
  relevancia    TEXT,           -- nota interna da equipe sobre interesse político
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_editais_ministerio ON editais (ministerio);
CREATE INDEX IF NOT EXISTS idx_editais_situacao   ON editais (situacao);
CREATE INDEX IF NOT EXISTS idx_editais_abertura   ON editais (data_abertura DESC);
