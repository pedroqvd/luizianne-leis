-- ============================================================
-- 001_init.sql
-- Schema inicial: deputados, proposições, autorias, votos,
-- tramitação (proceedings), comissões.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS deputies (
    id              SERIAL PRIMARY KEY,
    external_id     INTEGER UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    party           TEXT,
    state           TEXT,
    photo_url       TEXT,
    email           TEXT,
    legislatura     INTEGER,
    payload         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deputies_party ON deputies (party);
CREATE INDEX IF NOT EXISTS idx_deputies_state ON deputies (state);
CREATE INDEX IF NOT EXISTS idx_deputies_name_trgm ON deputies USING gin (name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS propositions (
    id              SERIAL PRIMARY KEY,
    external_id     INTEGER UNIQUE NOT NULL,
    type            TEXT NOT NULL,
    number          INTEGER,
    year            INTEGER,
    title           TEXT,
    summary         TEXT,
    status          TEXT,
    keywords        TEXT,
    url             TEXT,
    payload         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    presented_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_propositions_type ON propositions (type);
CREATE INDEX IF NOT EXISTS idx_propositions_year ON propositions (year);
CREATE INDEX IF NOT EXISTS idx_propositions_status ON propositions (status);
CREATE INDEX IF NOT EXISTS idx_propositions_type_year ON propositions (type, year);
CREATE INDEX IF NOT EXISTS idx_propositions_title_trgm ON propositions USING gin (title gin_trgm_ops);

CREATE TABLE IF NOT EXISTS proposition_authors (
    id              SERIAL PRIMARY KEY,
    proposition_id  INTEGER NOT NULL REFERENCES propositions(id) ON DELETE CASCADE,
    deputy_id       INTEGER NOT NULL REFERENCES deputies(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'author',  -- author | coauthor | rapporteur
    ordem           INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (proposition_id, deputy_id, role)
);

CREATE INDEX IF NOT EXISTS idx_pa_deputy ON proposition_authors (deputy_id);
CREATE INDEX IF NOT EXISTS idx_pa_proposition ON proposition_authors (proposition_id);
CREATE INDEX IF NOT EXISTS idx_pa_role ON proposition_authors (role);

CREATE TABLE IF NOT EXISTS votes (
    id              SERIAL PRIMARY KEY,
    proposition_id  INTEGER NOT NULL REFERENCES propositions(id) ON DELETE CASCADE,
    deputy_id       INTEGER REFERENCES deputies(id) ON DELETE SET NULL,
    vote            TEXT NOT NULL, -- Sim | Nao | Abstencao | Obstrucao | Ausente
    session_id      TEXT,
    date            TIMESTAMPTZ,
    payload         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (proposition_id, deputy_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_prop ON votes (proposition_id);
CREATE INDEX IF NOT EXISTS idx_votes_deputy ON votes (deputy_id);
CREATE INDEX IF NOT EXISTS idx_votes_date ON votes (date DESC);

-- Tramitação (histórico imutável)
CREATE TABLE IF NOT EXISTS proceedings (
    id              SERIAL PRIMARY KEY,
    proposition_id  INTEGER NOT NULL REFERENCES propositions(id) ON DELETE CASCADE,
    sequence        INTEGER,
    description     TEXT,
    body            TEXT,
    status_at_time  TEXT,
    date            TIMESTAMPTZ,
    payload         JSONB,
    hash            TEXT,           -- hash do evento para deduplicação
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (proposition_id, hash)
);

CREATE INDEX IF NOT EXISTS idx_proceedings_prop ON proceedings (proposition_id);
CREATE INDEX IF NOT EXISTS idx_proceedings_date ON proceedings (date DESC);

CREATE TABLE IF NOT EXISTS commissions (
    id              SERIAL PRIMARY KEY,
    external_id     INTEGER UNIQUE,
    name            TEXT NOT NULL,
    sigla           TEXT,
    payload         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deputy_commissions (
    id              SERIAL PRIMARY KEY,
    deputy_id       INTEGER NOT NULL REFERENCES deputies(id) ON DELETE CASCADE,
    commission_id   INTEGER NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
    role            TEXT,
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    UNIQUE (deputy_id, commission_id, role, started_at)
);

CREATE INDEX IF NOT EXISTS idx_dc_deputy ON deputy_commissions (deputy_id);
CREATE INDEX IF NOT EXISTS idx_dc_commission ON deputy_commissions (commission_id);

-- Eventos do sistema (audit / event sourcing leve para notificações)
CREATE TABLE IF NOT EXISTS system_events (
    id              BIGSERIAL PRIMARY KEY,
    type            TEXT NOT NULL,        -- NEW_PROPOSITION | STATUS_CHANGED | NEW_VOTE | NEW_RAPPORTEUR
    aggregate_type  TEXT NOT NULL,        -- proposition | vote | deputy
    aggregate_id    INTEGER,
    payload         JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_type_date ON system_events (type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_aggregate ON system_events (aggregate_type, aggregate_id);

-- Versionamento de propositions (snapshots para detectar diffs)
CREATE TABLE IF NOT EXISTS proposition_versions (
    id              BIGSERIAL PRIMARY KEY,
    proposition_id  INTEGER NOT NULL REFERENCES propositions(id) ON DELETE CASCADE,
    snapshot        JSONB NOT NULL,
    snapshot_hash   TEXT NOT NULL,
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (proposition_id, snapshot_hash)
);

CREATE INDEX IF NOT EXISTS idx_pv_prop ON proposition_versions (proposition_id);
