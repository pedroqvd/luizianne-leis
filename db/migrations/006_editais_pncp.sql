-- ============================================================
-- 006_editais_pncp.sql
-- Estende a tabela editais para suportar ingestão do PNCP
-- (Portal Nacional de Contratacoes Publicas).
-- ============================================================

-- Identificador único do edital no PNCP (numero_controle_pncp)
-- Formato: "{cnpj}-{ano}-{sequencial}"
ALTER TABLE editais ADD COLUMN IF NOT EXISTS pncp_id TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS cnpj_orgao TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS poder TEXT;        -- Executivo / Legislativo / Judiciário
ALTER TABLE editais ADD COLUMN IF NOT EXISTS esfera TEXT;       -- Federal / Estadual / Municipal / Distrital
ALTER TABLE editais ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS unidade_codigo TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS unidade_nome TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS modalidade_codigo INTEGER;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS data_publicacao DATE;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS data_proposta_inicio TIMESTAMPTZ;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS data_proposta_fim TIMESTAMPTZ;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS payload JSONB;

-- Unique constraint no pncp_id para upsert idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'editais_pncp_id_uniq'
  ) THEN
    ALTER TABLE editais ADD CONSTRAINT editais_pncp_id_uniq UNIQUE (pncp_id);
  END IF;
END $$;

-- Índices para os filtros mais comuns
CREATE INDEX IF NOT EXISTS idx_editais_pncp        ON editais (pncp_id);
CREATE INDEX IF NOT EXISTS idx_editais_esfera      ON editais (esfera, situacao);
CREATE INDEX IF NOT EXISTS idx_editais_proposta_fim ON editais (data_proposta_fim DESC) WHERE situacao = 'aberto';

-- Auto-update do updated_at
CREATE OR REPLACE FUNCTION update_editais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_editais_updated_at ON editais;
CREATE TRIGGER trg_editais_updated_at
BEFORE UPDATE ON editais
FOR EACH ROW EXECUTE FUNCTION update_editais_updated_at();
