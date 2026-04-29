-- ============================================================
-- 004_auth.sql
-- Gestão de equipe, áreas de notificação e assinaturas.
-- ============================================================

-- Perfil dos membros da equipe (espelha auth.users do Supabase)
CREATE TABLE IF NOT EXISTS app_users (
  id          UUID        PRIMARY KEY,
  email       TEXT        NOT NULL UNIQUE,
  name        TEXT,
  role        TEXT        NOT NULL DEFAULT 'member',  -- 'admin' | 'member'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users (email);
CREATE INDEX IF NOT EXISTS idx_app_users_role  ON app_users (role);

-- Áreas temáticas para filtragem de notificações
CREATE TABLE IF NOT EXISTS notification_areas (
  id          SERIAL  PRIMARY KEY,
  slug        TEXT    UNIQUE NOT NULL,
  label       TEXT    NOT NULL,
  description TEXT
);

INSERT INTO notification_areas (slug, label, description) VALUES
  ('legislativo', 'Legislativo', 'PLs, relatorias, projetos e requerimentos'),
  ('emendas',     'Emendas',     'Emendas parlamentares e legislativas'),
  ('votacoes',    'Votações',    'Votações em plenário e comissões'),
  ('atividade',   'Atividade',   'Todos os eventos de domínio')
ON CONFLICT (slug) DO NOTHING;

-- Assinaturas por usuário/área — controladas pelo admin
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id   UUID    NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  area_id   INTEGER NOT NULL REFERENCES notification_areas(id) ON DELETE CASCADE,
  enabled   BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, area_id)
);

CREATE INDEX IF NOT EXISTS idx_usub_user ON user_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_usub_area ON user_subscriptions (area_id, enabled);
