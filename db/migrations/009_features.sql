-- ============================================================
-- 009_features.sql
-- Controle de acesso por aba, presença no gabinete e demandas.
-- ============================================================

-- Área de notificação para ausências (complemento da 004)
INSERT INTO notification_areas (slug, label, description) VALUES
  ('ausencias', 'Ausências', 'Alertas de ausência em votações nominais')
ON CONFLICT (slug) DO NOTHING;

-- ── 1. Controle de acesso às abas por usuário ─────────────────────────────
-- Sem linha = acesso liberado (opt-out). Admin nunca é restrito.
CREATE TABLE IF NOT EXISTS user_tab_permissions (
  user_id   UUID    NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  tab_slug  TEXT    NOT NULL,
  enabled   BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, tab_slug)
);

CREATE INDEX IF NOT EXISTS idx_tab_perm_user ON user_tab_permissions (user_id);

-- ── 2. Presença no gabinete ────────────────────────────────────────────────
-- AVISO: crie o bucket "presence-photos" no Supabase Storage (público ou privado).
CREATE TABLE IF NOT EXISTS presence_records (
  id          SERIAL      PRIMARY KEY,
  location    TEXT        NOT NULL CHECK (location IN ('brasilia', 'fortaleza')),
  date        DATE        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'expediente',
  notes       TEXT,
  photo_url   TEXT,
  created_by  UUID        REFERENCES app_users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presence_date     ON presence_records (date DESC);
CREATE INDEX IF NOT EXISTS idx_presence_location ON presence_records (location);

-- ── 3. Demandas espontâneas ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demands (
  id                SERIAL      PRIMARY KEY,
  title             TEXT        NOT NULL,
  requester_name    TEXT,
  requester_contact TEXT,
  description       TEXT,
  category          TEXT        NOT NULL DEFAULT 'geral',
  status            TEXT        NOT NULL DEFAULT 'novo'
                    CHECK (status IN ('novo','em_andamento','aguardando','resolvido','arquivado')),
  priority          TEXT        NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('urgente','alta','normal','baixa')),
  assigned_to       UUID        REFERENCES app_users(id) ON DELETE SET NULL,
  due_date          DATE,
  notes             TEXT,
  created_by        UUID        REFERENCES app_users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demands_status   ON demands (status);
CREATE INDEX IF NOT EXISTS idx_demands_category ON demands (category);
CREATE INDEX IF NOT EXISTS idx_demands_assigned ON demands (assigned_to);
CREATE INDEX IF NOT EXISTS idx_demands_due_date ON demands (due_date);

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_demands_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_demands_updated_at ON demands;
CREATE TRIGGER trg_demands_updated_at
  BEFORE UPDATE ON demands
  FOR EACH ROW EXECUTE FUNCTION update_demands_updated_at();
