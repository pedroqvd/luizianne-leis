-- Migration 014: CEAP expenses + Parliamentary speeches
-- CEAP = Cota para o Exercício da Atividade Parlamentar
-- Source: API da Câmara /deputados/{id}/despesas and /deputados/{id}/discursos

-- ── CEAP Despesas ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ceap_despesas (
  id                SERIAL PRIMARY KEY,
  deputy_id         INTEGER NOT NULL REFERENCES deputies(id) ON DELETE CASCADE,
  ano               SMALLINT NOT NULL,
  mes               SMALLINT NOT NULL,
  tipo_despesa      TEXT,
  cod_documento     BIGINT,
  tipo_documento    TEXT,
  data_documento    DATE,
  num_documento     TEXT,
  valor_bruto       NUMERIC(12,2) DEFAULT 0,
  valor_glosa       NUMERIC(12,2) DEFAULT 0,
  valor_liquido     NUMERIC(12,2) DEFAULT 0,
  num_ressarcimento TEXT,
  cod_lote          BIGINT,
  fornecedor        TEXT,
  nome_fornecedor   TEXT,
  cnpj_cpf          TEXT,
  url_documento     TEXT,
  payload           JSONB,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (deputy_id, ano, mes, cod_documento)
);

CREATE INDEX IF NOT EXISTS ceap_despesas_deputy_ano
  ON ceap_despesas (deputy_id, ano DESC, mes DESC);

CREATE INDEX IF NOT EXISTS ceap_despesas_tipo
  ON ceap_despesas (tipo_despesa);

CREATE INDEX IF NOT EXISTS ceap_despesas_fornecedor
  ON ceap_despesas (cnpj_cpf);

-- ── Discursos ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS discursos (
  id               SERIAL PRIMARY KEY,
  deputy_id        INTEGER NOT NULL REFERENCES deputies(id) ON DELETE CASCADE,
  data_hora_inicio TIMESTAMPTZ NOT NULL,
  data_hora_fim    TIMESTAMPTZ,
  fase             TEXT,
  tipo             TEXT,
  keywords         TEXT,
  sumario          TEXT,
  url_texto        TEXT,
  url_audio        TEXT,
  url_video        TEXT,
  payload          JSONB,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (deputy_id, data_hora_inicio)
);

CREATE INDEX IF NOT EXISTS discursos_deputy_data
  ON discursos (deputy_id, data_hora_inicio DESC);

CREATE INDEX IF NOT EXISTS discursos_keywords
  ON discursos USING gin (to_tsvector('portuguese', coalesce(keywords, '') || ' ' || coalesce(sumario, '')));
