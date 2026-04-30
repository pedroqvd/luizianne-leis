-- ============================================================
-- 008_emendas_orcamentarias.sql
-- Emendas parlamentares orçamentárias via Portal da Transparência.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS emendas_orcamentarias (
  id                    serial PRIMARY KEY,
  ano                   integer NOT NULL,
  codigo_emenda         text UNIQUE,          -- identificador único do Portal da Transparência
  numero_emenda         text,
  tipo_emenda           text,                  -- Individual | RP6 | RP7 | RP8 | RP9 | Comissao
  funcao                text,
  descricao_funcao      text,
  subfuncao             text,
  descricao_subfuncao   text,
  descricao             text,                  -- objeto/descrição da emenda
  valor_dotacao         numeric(18,2),         -- valor autorizado
  valor_empenhado       numeric(18,2),
  valor_liquidado       numeric(18,2),
  valor_pago            numeric(18,2),         -- efetivamente pago
  orgao_orcamentario    text,
  municipio             text,
  uf                    text,
  situacao              text,
  payload               jsonb,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emendas_orc_ano    ON emendas_orcamentarias (ano);
CREATE INDEX IF NOT EXISTS idx_emendas_orc_tipo   ON emendas_orcamentarias (tipo_emenda);
CREATE INDEX IF NOT EXISTS idx_emendas_orc_uf     ON emendas_orcamentarias (uf);
CREATE INDEX IF NOT EXISTS idx_emendas_orc_mun    ON emendas_orcamentarias USING gin (municipio gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_emendas_orc_desc   ON emendas_orcamentarias USING gin (descricao gin_trgm_ops);

CREATE OR REPLACE FUNCTION update_emendas_orc_ts()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_emendas_orc_ts ON emendas_orcamentarias;
CREATE TRIGGER trg_emendas_orc_ts
  BEFORE UPDATE ON emendas_orcamentarias
  FOR EACH ROW EXECUTE FUNCTION update_emendas_orc_ts();

-- Área de notificação para emendas
INSERT INTO notification_areas (slug, label, description)
VALUES (
  'emendas',
  'Emendas Orçamentárias',
  'Alertas sobre novas emendas e atualizações de execução'
)
ON CONFLICT (slug) DO NOTHING;
