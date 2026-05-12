-- Migration 017: Proposições relacionadas / apensadas
-- A Câmara agrupa proposições com o mesmo tema via "apensação".
-- Armazenamos todas as relações retornadas por /proposicoes/{id}/relacionadas.

CREATE TABLE IF NOT EXISTS proposition_relations (
  id                   SERIAL PRIMARY KEY,
  proposition_id       INT  NOT NULL REFERENCES propositions(id) ON DELETE CASCADE,
  related_external_id  INT  NOT NULL,
  related_internal_id  INT  REFERENCES propositions(id) ON DELETE SET NULL,
  related_sigla_tipo   TEXT,
  related_numero       INT,
  related_ano          INT,
  related_ementa       TEXT,
  relation_type        TEXT NOT NULL DEFAULT 'relacionada',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (proposition_id, related_external_id)
);

CREATE INDEX IF NOT EXISTS idx_prop_relations_prop_id
  ON proposition_relations (proposition_id);

CREATE INDEX IF NOT EXISTS idx_prop_relations_related_internal
  ON proposition_relations (related_internal_id)
  WHERE related_internal_id IS NOT NULL;
