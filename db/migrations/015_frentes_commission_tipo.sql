-- Migration 015: Frentes parlamentares + tipo/casa em comissões

-- ── Adiciona tipo e casa às comissões ────────────────────────────────────────
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS tipo TEXT;
-- tipo: 'permanente' | 'temporária' | 'mista' | 'especial' | 'externa' | 'parlamentar de inquérito' | 'subcomissão'

ALTER TABLE commissions ADD COLUMN IF NOT EXISTS casa TEXT NOT NULL DEFAULT 'camara';
-- casa: 'camara' | 'senado' | 'congresso'
-- Para comissões mistas (câmara + senado), casa = 'congresso'

-- Tenta inferir tipo/casa a partir dos dados já armazenados no payload
UPDATE commissions
SET tipo = CASE
  WHEN lower(name) LIKE '%mista%'              THEN 'mista'
  WHEN lower(name) LIKE '%permanente%'         THEN 'permanente'
  WHEN lower(name) LIKE '%temporária%'         THEN 'temporária'
  WHEN lower(name) LIKE '%especial%'           THEN 'especial'
  WHEN lower(name) LIKE '%parlamentar de inq%' THEN 'parlamentar de inquérito'
  WHEN lower(name) LIKE '%subcomissão%'        THEN 'subcomissão'
  ELSE 'permanente'
END
WHERE tipo IS NULL;

UPDATE commissions
SET casa = 'congresso'
WHERE lower(name) LIKE '%mista%' OR sigla IN ('CMCVM', 'CMO', 'CMPCP', 'CMMC');

-- ── Frentes parlamentares ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS frentes_parlamentares (
  id             SERIAL PRIMARY KEY,
  external_id    INTEGER UNIQUE NOT NULL,
  titulo         TEXT NOT NULL,
  keywords       TEXT,
  id_legislatura INTEGER,
  url_website    TEXT,
  payload        JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS frente_membros (
  id          SERIAL PRIMARY KEY,
  deputy_id   INTEGER NOT NULL REFERENCES deputies(id) ON DELETE CASCADE,
  frente_id   INTEGER NOT NULL REFERENCES frentes_parlamentares(id) ON DELETE CASCADE,
  role        TEXT,  -- 'Titular' | 'Coordenador' | 'Presidente' | 'Vice-Presidente'
  payload     JSONB,
  UNIQUE (deputy_id, frente_id)
);

CREATE INDEX IF NOT EXISTS idx_frente_membros_deputy ON frente_membros (deputy_id);
CREATE INDEX IF NOT EXISTS idx_frente_membros_frente ON frente_membros (frente_id);
