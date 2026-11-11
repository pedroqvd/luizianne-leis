-- ============================================================
-- 020_editais_ministerios_autarquias.sql
-- Mapeamento sistemático de Editais Federais por Ministério e Autarquias
-- Permite identificar em tempo real os editais ativos de cada um dos
-- 30+ Ministérios Federais e de mais de 60 Autarquias e Fundações.
-- ============================================================

-- 1. Colunas canônicas para categorização ministerial e institucional
ALTER TABLE editais ADD COLUMN IF NOT EXISTS ministerio_slug  TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS ministerio_sigla TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS autarquia        TEXT;

-- 2. Índices de alta performance para filtros por ministério, autarquia e situação
CREATE INDEX IF NOT EXISTS idx_editais_min_slug   ON editais (ministerio_slug);
CREATE INDEX IF NOT EXISTS idx_editais_min_sigla  ON editais (ministerio_sigla);
CREATE INDEX IF NOT EXISTS idx_editais_autarquia  ON editais (autarquia);
CREATE INDEX IF NOT EXISTS idx_editais_min_sit    ON editais (ministerio_slug, situacao);

-- 3. Atualização do gatilho de busca textual (Full-Text Search)
-- para indexar sigla ministerial e nome da autarquia
CREATE OR REPLACE FUNCTION editais_fts_trigger()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.titulo, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.objeto, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.categoria_tematica, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.orgao, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.ministerio, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.ministerio_sigla, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.autarquia, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.municipio, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_editais_fts ON editais;
CREATE TRIGGER trg_editais_fts
  BEFORE INSERT OR UPDATE ON editais
  FOR EACH ROW EXECUTE FUNCTION editais_fts_trigger();

-- 4. Normalização / Backfill de editais existentes sem classificação canônica
UPDATE editais
SET
  ministerio = 'Ministério da Saúde',
  ministerio_slug = 'saude',
  ministerio_sigla = 'MS',
  autarquia = CASE
    WHEN orgao ILIKE '%fiocruz%' OR orgao ILIKE '%oswaldo cruz%' THEN 'FIOCRUZ — Fundação Oswaldo Cruz'
    WHEN orgao ILIKE '%funasa%' THEN 'FUNASA — Fundação Nacional de Saúde'
    WHEN orgao ILIKE '%anvisa%' THEN 'ANVISA — Agência Nacional de Vigilância Sanitária'
    WHEN orgao ILIKE '%ebserh%' THEN 'EBSERH — Empresa Brasileira de Serviços Hospitalares'
    ELSE autarquia
  END
WHERE (ministerio_slug IS NULL)
  AND (orgao ILIKE '%saude%' OR orgao ILIKE '%fiocruz%' OR orgao ILIKE '%funasa%' OR orgao ILIKE '%anvisa%' OR orgao ILIKE '%ebserh%');

UPDATE editais
SET
  ministerio = 'Ministério da Educação',
  ministerio_slug = 'educacao',
  ministerio_sigla = 'MEC',
  autarquia = CASE
    WHEN orgao ILIKE '%fnde%' OR orgao ILIKE '%fundo nacional de desenvolvimento da educacao%' THEN 'FNDE — Fundo Nacional de Desenvolvimento da Educação'
    WHEN orgao ILIKE '%capes%' THEN 'CAPES — Coordenação de Aperfeiçoamento de Pessoal de Nível Superior'
    WHEN orgao ILIKE '%inep%' THEN 'INEP — Instituto Nacional de Estudos e Pesquisas Educacionais'
    WHEN orgao ILIKE '%ufc%' OR orgao ILIKE '%universidade federal do ceara%' THEN 'UFC — Universidade Federal do Ceará'
    WHEN orgao ILIKE '%ifce%' OR orgao ILIKE '%instituto federal do ceara%' THEN 'IFCE — Instituto Federal do Ceará'
    WHEN orgao ILIKE '%ufca%' THEN 'UFCA — Universidade Federal do Cariri'
    WHEN orgao ILIKE '%unilab%' THEN 'UNILAB — Universidade da Integração Internacional da Lusofonia Afro-Brasileira'
    ELSE autarquia
  END
WHERE (ministerio_slug IS NULL)
  AND (orgao ILIKE '%educacao%' OR orgao ILIKE '%fnde%' OR orgao ILIKE '%capes%' OR orgao ILIKE '%inep%' OR orgao ILIKE '%ufc%' OR orgao ILIKE '%ifce%');

UPDATE editais
SET
  ministerio = 'Ministério da Integração e do Desenvolvimento Regional',
  ministerio_slug = 'midr',
  ministerio_sigla = 'MIDR',
  autarquia = CASE
    WHEN orgao ILIKE '%dnocs%' OR orgao ILIKE '%departamento nacional de obras contra as secas%' THEN 'DNOCS — Departamento Nacional de Obras Contra as Secas'
    WHEN orgao ILIKE '%codevasf%' THEN 'CODEVASF — Companhia de Desenvolvimento dos Vales do São Francisco e do Parnaíba'
    WHEN orgao ILIKE '%sudene%' THEN 'SUDENE — Superintendência do Desenvolvimento do Nordeste'
    ELSE autarquia
  END
WHERE (ministerio_slug IS NULL)
  AND (orgao ILIKE '%integracao%' OR orgao ILIKE '%dnocs%' OR orgao ILIKE '%codevasf%' OR orgao ILIKE '%sudene%');

UPDATE editais
SET
  ministerio = 'Ministério das Cidades',
  ministerio_slug = 'cidades',
  ministerio_sigla = 'MCID',
  autarquia = CASE
    WHEN orgao ILIKE '%cbtu%' THEN 'CBTU — Companhia Brasileira de Trens Urbanos'
    ELSE autarquia
  END
WHERE (ministerio_slug IS NULL)
  AND (orgao ILIKE '%ministerio das cidades%' OR orgao ILIKE '%cbtu%' OR orgao ILIKE '%habitacao%');

UPDATE editais
SET
  ministerio = 'Ministério do Meio Ambiente e Mudança do Clima',
  ministerio_slug = 'meio_ambiente',
  ministerio_sigla = 'MMA',
  autarquia = CASE
    WHEN orgao ILIKE '%ibama%' THEN 'IBAMA — Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis'
    WHEN orgao ILIKE '%icmbio%' THEN 'ICMBio — Instituto Chico Mendes de Conservação da Biodiversidade'
    WHEN orgao ILIKE '%ana%' OR orgao ILIKE '%aguas%' THEN 'ANA — Agência Nacional de Águas e Saneamento Básico'
    ELSE autarquia
  END
WHERE (ministerio_slug IS NULL)
  AND (orgao ILIKE '%meio ambiente%' OR orgao ILIKE '%ibama%' OR orgao ILIKE '%icmbio%' OR orgao ILIKE '%agencia nacional de aguas%');

UPDATE editais
SET
  ministerio = 'Ministério da Agricultura e Pecuária',
  ministerio_slug = 'mapa',
  ministerio_sigla = 'MAPA',
  autarquia = CASE
    WHEN orgao ILIKE '%embrapa%' THEN 'EMBRAPA — Empresa Brasileira de Pesquisa Agropecuária'
    WHEN orgao ILIKE '%conab%' THEN 'CONAB — Companhia Nacional de Abastecimento'
    ELSE autarquia
  END
WHERE (ministerio_slug IS NULL)
  AND (orgao ILIKE '%agricultura%' OR orgao ILIKE '%embrapa%' OR orgao ILIKE '%conab%');

UPDATE editais
SET
  ministerio = 'Ministério do Desenvolvimento Agrário e Agricultura Familiar',
  ministerio_slug = 'mda',
  ministerio_sigla = 'MDA',
  autarquia = CASE
    WHEN orgao ILIKE '%incra%' THEN 'INCRA — Instituto Nacional de Colonização e Reforma Agrária'
    ELSE autarquia
  END
WHERE (ministerio_slug IS NULL)
  AND (orgao ILIKE '%desenvolvimento agrario%' OR orgao ILIKE '%incra%');

UPDATE editais
SET
  ministerio = 'Ministério dos Transportes',
  ministerio_slug = 'transportes',
  ministerio_sigla = 'MT',
  autarquia = CASE
    WHEN orgao ILIKE '%dnit%' THEN 'DNIT — Departamento Nacional de Infraestrutura de Transportes'
    WHEN orgao ILIKE '%antt%' THEN 'ANTT — Agência Nacional de Transportes Terrestres'
    ELSE autarquia
  END
WHERE (ministerio_slug IS NULL)
  AND (orgao ILIKE '%transportes%' OR orgao ILIKE '%dnit%' OR orgao ILIKE '%antt%');

UPDATE editais
SET
  ministerio = 'Ministério da Justiça e Segurança Pública',
  ministerio_slug = 'justica',
  ministerio_sigla = 'MJSP',
  autarquia = CASE
    WHEN orgao ILIKE '%policia federal%' OR orgao ILIKE '%dpf%' THEN 'PF — Polícia Federal'
    WHEN orgao ILIKE '%policia rodoviaria%' OR orgao ILIKE '%prf%' THEN 'PRF — Polícia Rodoviária Federal'
    WHEN orgao ILIKE '%funai%' THEN 'FUNAI — Fundação Nacional dos Povos Indígenas'
    ELSE autarquia
  END
WHERE (ministerio_slug IS NULL)
  AND (orgao ILIKE '%justica%' OR orgao ILIKE '%policia federal%' OR orgao ILIKE '%prf%');

-- Para registros restantes da esfera federal sem slug atribuído
UPDATE editais
SET
  ministerio_slug = 'outros_orgaos',
  ministerio_sigla = 'OUT'
WHERE ministerio_slug IS NULL;
