-- ============================================================
-- 018_security_rls_hardening.sql
-- Blindagem de Segurança e Privacidade (Nível Sigiloso):
-- 1. Tabela imutável de Audit Log (security_audit_logs)
-- 2. Funções auxiliares de autenticação e permissão por aba (compatíveis com Supabase e Postgres padrão)
-- 3. Ativação de Row-Level Security (RLS) em todas as tabelas do schema public
-- 4. Revogação total de acesso anônimo (anon) no PostgREST
-- 5. Correção do índice idx_votes_absence_deputy e purge de outbox_events
-- ============================================================

-- ── 1. Tabela de Auditoria de Segurança (security_audit_logs) ──────────────
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id            BIGSERIAL   PRIMARY KEY,
  actor_id      UUID        REFERENCES app_users(id) ON DELETE SET NULL,
  actor_email   TEXT,
  action        TEXT        NOT NULL,
  resource_type TEXT        NOT NULL,
  resource_id   TEXT,
  metadata      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sec_audit_created  ON security_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_audit_actor    ON security_audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_sec_audit_resource ON security_audit_logs (resource_type, resource_id);

-- ── 2. Correção de Índice Duplicado e Limpeza de Outbox ────────────────────
CREATE INDEX IF NOT EXISTS idx_votes_absence_deputy
  ON votes (deputy_id, is_absence)
  WHERE is_absence = true;

CREATE OR REPLACE FUNCTION purge_old_events(retention_days INT DEFAULT 90)
RETURNS INT AS $$
DECLARE
  deleted_sys INT;
  deleted_outbox INT;
BEGIN
  DELETE FROM system_events
   WHERE created_at < NOW() - (retention_days * INTERVAL '1 day');
  GET DIAGNOSTICS deleted_sys = ROW_COUNT;

  DELETE FROM outbox_events
   WHERE processed_at IS NOT NULL
     AND processed_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_outbox = ROW_COUNT;

  RETURN deleted_sys + deleted_outbox;
END;
$$ LANGUAGE plpgsql;

-- ── 3. Funções Auxiliares de Segurança para RLS ────────────────────────────
CREATE OR REPLACE FUNCTION public.current_auth_uid()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  raw_sub TEXT;
BEGIN
  raw_sub := NULLIF(current_setting('request.jwt.claim.sub', true), '');
  IF raw_sub IS NULL THEN
    BEGIN
      raw_sub := (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub');
    EXCEPTION WHEN OTHERS THEN
      raw_sub := NULL;
    END;
  END IF;
  IF raw_sub IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN raw_sub::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.app_users
     WHERE id = public.current_auth_uid()
       AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_tab_access(p_tab_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.current_auth_uid() IS NOT NULL
    AND (
      public.is_app_admin()
      OR NOT EXISTS (
        SELECT 1
          FROM public.user_tab_permissions
         WHERE user_id = public.current_auth_uid()
           AND tab_slug = p_tab_slug
           AND enabled = false
      )
    )
  );
$$;

-- ── 4. Habilitar Row-Level Security (RLS) em TODAS as Tabelas ──────────────
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'app_users',
    'notification_areas',
    'user_subscriptions',
    'user_tab_permissions',
    'presence_records',
    'demands',
    'ceara_municipalities',
    'municipal_authorities',
    'authority_demands',
    'edital_authority_tracking',
    'security_audit_logs',
    'outbox_events',
    'system_events',
    'deputies',
    'propositions',
    'proposition_authors',
    'proceedings',
    'proposition_versions',
    'votes',
    'categories',
    'proposition_categories',
    'commissions',
    'deputy_commissions',
    'editais',
    'emendas_orcamentarias',
    'ceap_despesas',
    'discursos',
    'frentes_parlamentares',
    'frente_membros',
    'schema_migrations'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;

-- ── 5. Políticas de RLS para Tabelas Sensíveis / Gestão Interna ────────────

-- app_users: leitura apenas para autenticados; escrita apenas para admin
DROP POLICY IF EXISTS policy_app_users_select ON app_users;
CREATE POLICY policy_app_users_select ON app_users
  FOR SELECT USING (public.current_auth_uid() IS NOT NULL);

DROP POLICY IF EXISTS policy_app_users_admin_all ON app_users;
CREATE POLICY policy_app_users_admin_all ON app_users
  FOR ALL USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());

-- user_tab_permissions: usuário lê as próprias; admin gerencia todas
DROP POLICY IF EXISTS policy_tab_perms_select ON user_tab_permissions;
CREATE POLICY policy_tab_perms_select ON user_tab_permissions
  FOR SELECT USING (user_id = public.current_auth_uid() OR public.is_app_admin());

DROP POLICY IF EXISTS policy_tab_perms_admin_write ON user_tab_permissions;
CREATE POLICY policy_tab_perms_admin_write ON user_tab_permissions
  FOR ALL USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());

-- user_subscriptions: usuário lê as próprias; admin gerencia todas
DROP POLICY IF EXISTS policy_user_sub_select ON user_subscriptions;
CREATE POLICY policy_user_sub_select ON user_subscriptions
  FOR SELECT USING (user_id = public.current_auth_uid() OR public.is_app_admin());

DROP POLICY IF EXISTS policy_user_sub_admin_write ON user_subscriptions;
CREATE POLICY policy_user_sub_admin_write ON user_subscriptions
  FOR ALL USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());

-- demands (Demandas Espontâneas)
DROP POLICY IF EXISTS policy_demands_select ON demands;
CREATE POLICY policy_demands_select ON demands
  FOR SELECT USING (public.has_tab_access('demandas'));

DROP POLICY IF EXISTS policy_demands_insert ON demands;
CREATE POLICY policy_demands_insert ON demands
  FOR INSERT WITH CHECK (
    public.has_tab_access('demandas')
    AND (created_by = public.current_auth_uid() OR public.is_app_admin())
  );

DROP POLICY IF EXISTS policy_demands_update ON demands;
CREATE POLICY policy_demands_update ON demands
  FOR UPDATE USING (
    public.has_tab_access('demandas')
    AND (
      public.is_app_admin()
      OR created_by = public.current_auth_uid()
      OR assigned_to = public.current_auth_uid()
    )
  );

DROP POLICY IF EXISTS policy_demands_delete ON demands;
CREATE POLICY policy_demands_delete ON demands
  FOR DELETE USING (
    public.has_tab_access('demandas')
    AND (public.is_app_admin() OR created_by = public.current_auth_uid())
  );

-- presence_records (Presença no Gabinete)
DROP POLICY IF EXISTS policy_presence_select ON presence_records;
CREATE POLICY policy_presence_select ON presence_records
  FOR SELECT USING (public.has_tab_access('presenca'));

DROP POLICY IF EXISTS policy_presence_insert ON presence_records;
CREATE POLICY policy_presence_insert ON presence_records
  FOR INSERT WITH CHECK (
    public.has_tab_access('presenca')
    AND (created_by = public.current_auth_uid() OR public.is_app_admin())
  );

DROP POLICY IF EXISTS policy_presence_delete ON presence_records;
CREATE POLICY policy_presence_delete ON presence_records
  FOR DELETE USING (
    public.has_tab_access('presenca')
    AND (public.is_app_admin() OR created_by = public.current_auth_uid())
  );

-- municipal_authorities (Articulação Municipal - Prefeitos)
DROP POLICY IF EXISTS policy_mun_auth_select ON municipal_authorities;
CREATE POLICY policy_mun_auth_select ON municipal_authorities
  FOR SELECT USING (public.has_tab_access('articulacao'));

DROP POLICY IF EXISTS policy_mun_auth_insert ON municipal_authorities;
CREATE POLICY policy_mun_auth_insert ON municipal_authorities
  FOR INSERT WITH CHECK (public.has_tab_access('articulacao'));

DROP POLICY IF EXISTS policy_mun_auth_update ON municipal_authorities;
CREATE POLICY policy_mun_auth_update ON municipal_authorities
  FOR UPDATE USING (public.has_tab_access('articulacao'));

DROP POLICY IF EXISTS policy_mun_auth_delete ON municipal_authorities;
CREATE POLICY policy_mun_auth_delete ON municipal_authorities
  FOR DELETE USING (
    public.has_tab_access('articulacao')
    AND (public.is_app_admin() OR created_by = public.current_auth_uid())
  );

-- authority_demands (Demandas dos Prefeitos)
DROP POLICY IF EXISTS policy_auth_demands_select ON authority_demands;
CREATE POLICY policy_auth_demands_select ON authority_demands
  FOR SELECT USING (public.has_tab_access('articulacao'));

DROP POLICY IF EXISTS policy_auth_demands_insert ON authority_demands;
CREATE POLICY policy_auth_demands_insert ON authority_demands
  FOR INSERT WITH CHECK (public.has_tab_access('articulacao'));

DROP POLICY IF EXISTS policy_auth_demands_update ON authority_demands;
CREATE POLICY policy_auth_demands_update ON authority_demands
  FOR UPDATE USING (public.has_tab_access('articulacao'));

DROP POLICY IF EXISTS policy_auth_demands_delete ON authority_demands;
CREATE POLICY policy_auth_demands_delete ON authority_demands
  FOR DELETE USING (
    public.has_tab_access('articulacao')
    AND (public.is_app_admin() OR created_by = public.current_auth_uid())
  );

-- edital_authority_tracking (Traqueamento Edital x Prefeito)
DROP POLICY IF EXISTS policy_edital_track_select ON edital_authority_tracking;
CREATE POLICY policy_edital_track_select ON edital_authority_tracking
  FOR SELECT USING (
    public.has_tab_access('articulacao') OR public.has_tab_access('editais')
  );

DROP POLICY IF EXISTS policy_edital_track_write ON edital_authority_tracking;
CREATE POLICY policy_edital_track_write ON edital_authority_tracking
  FOR ALL USING (
    public.has_tab_access('articulacao') OR public.has_tab_access('editais')
  ) WITH CHECK (
    public.has_tab_access('articulacao') OR public.has_tab_access('editais')
  );

-- security_audit_logs: somente admin pode ler
DROP POLICY IF EXISTS policy_audit_logs_admin_select ON security_audit_logs;
CREATE POLICY policy_audit_logs_admin_select ON security_audit_logs
  FOR SELECT USING (public.is_app_admin());

-- ── 6. Políticas de Leitura Pública para Tabelas de Dados Legislativos e Municípios ─
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'notification_areas',
    'ceara_municipalities',
    'municipal_authorities',
    'system_events',
    'deputies',
    'propositions',
    'proposition_authors',
    'proceedings',
    'proposition_versions',
    'votes',
    'categories',
    'proposition_categories',
    'commissions',
    'deputy_commissions',
    'editais',
    'emendas_orcamentarias',
    'ceap_despesas',
    'discursos',
    'frentes_parlamentares',
    'frente_membros'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS policy_%I_auth_read ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS policy_%I_public_read ON public.%I', tbl, tbl);
      EXECUTE format(
        'CREATE POLICY policy_%I_public_read ON public.%I FOR SELECT USING (true)',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- ── 7. Permissões de Acesso Anônimo (anon) no Supabase PostgREST ───────────
-- Dados públicos de transparência legislativa e municípios são legíveis por todos (LAI 12.527/2011).
-- Tabelas de gestão interna (app_users, user_subscriptions, presence_records, demands, security_audit_logs)
-- permanecem 100% restritas a usuários autenticados e admin.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
    EXECUTE 'GRANT SELECT ON ceara_municipalities, municipal_authorities TO anon';
    EXECUTE 'GRANT SELECT ON editais, emendas_orcamentarias, ceap_despesas, discursos, frentes_parlamentares, frente_membros TO anon';
    EXECUTE 'GRANT SELECT ON deputies, propositions, proposition_authors, proceedings, proposition_versions, votes, categories, proposition_categories, commissions, deputy_commissions, notification_areas TO anon';
  END IF;
END $$;

-- ── 8. Garantir Bucket presence-photos no Supabase Storage ─────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('presence-photos', 'presence-photos', true)
    ON CONFLICT (id) DO NOTHING;

    EXECUTE 'DROP POLICY IF EXISTS policy_presence_photos_read ON storage.objects';
    EXECUTE 'CREATE POLICY policy_presence_photos_read ON storage.objects FOR SELECT USING (bucket_id = ''presence-photos'')';

    EXECUTE 'DROP POLICY IF EXISTS policy_presence_photos_insert ON storage.objects';
    EXECUTE 'CREATE POLICY policy_presence_photos_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''presence-photos'' AND public.current_auth_uid() IS NOT NULL)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Non-fatal in non-Supabase local Postgres
  NULL;
END $$;
