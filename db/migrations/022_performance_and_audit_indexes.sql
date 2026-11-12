-- ============================================================
-- 022_performance_and_audit_indexes.sql
-- Índices adicionais de alta performance identificados na auditoria:
-- 1. propositions: ordenação composta (presented_at DESC, id DESC)
-- 2. authority_demands: ordenação por created_at DESC
-- 3. emendas_orcamentarias: ordenação composta (ano DESC, valor_dotacao DESC)
-- 4. ceap_despesas: ordenação composta (deputy_id, ano DESC, mes DESC, data_documento DESC)
-- 5. editais: filtro de busca por prefeituras + situação
-- ============================================================

-- 1. propositions: permite index scan puro para listagens da aba Legislativo
CREATE INDEX IF NOT EXISTS idx_propositions_presented_id
  ON propositions (presented_at DESC NULLS LAST, id DESC);

-- 2. authority_demands: otimiza carregamento inicial do painel de Articulação Municipal
CREATE INDEX IF NOT EXISTS idx_auth_demands_created
  ON authority_demands (created_at DESC);

-- 3. emendas_orcamentarias: otimiza listagem de emendas por ano e valor
CREATE INDEX IF NOT EXISTS idx_emendas_orc_ano_dotacao
  ON emendas_orcamentarias (ano DESC, valor_dotacao DESC NULLS LAST);

-- 4. ceap_despesas: otimiza paginação de despesas
CREATE INDEX IF NOT EXISTS idx_ceap_deputy_ano_mes_data
  ON ceap_despesas (deputy_id, ano DESC, mes DESC, data_documento DESC NULLS LAST);

-- 5. editais: índice parcial para editais abertos elegíveis a prefeituras
CREATE INDEX IF NOT EXISTS idx_editais_abertos_prefeituras
  ON editais (situacao, elegivel_prefeituras)
  WHERE situacao = 'aberto';

-- 6. proposition_authors: índice de cobertura para contadores de autoria e listagens filtradas por papel
CREATE INDEX IF NOT EXISTS idx_pa_deputy_role_prop
  ON proposition_authors (deputy_id, role, proposition_id);

