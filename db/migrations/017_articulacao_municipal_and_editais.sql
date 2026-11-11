-- ============================================================
-- 017_articulacao_municipal_and_editais.sql
-- 1. Base dos 184 municípios do Ceará e suas 14 macrorregiões
-- 2. Perfis de Prefeitos e Autoridades Municipais (Base Aliada)
-- 3. Carteira de Demandas Municipais com Full-Text Search
-- 4. Enriquecimento profundo de Editais + Full-Text Search
-- 5. Pipeline de Traqueamento / Matchmaking (Edital x Prefeito x Demanda)
-- 6. Índice único em v_coauthorship_edges para REFRESH CONCURRENTLY
-- ============================================================

-- Nova área de notificação para Articulação Municipal
INSERT INTO notification_areas (slug, label, description) VALUES
  ('articulacao', 'Articulação Municipal', 'Demandas de prefeitos aliados e matchmaking com editais federais')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO user_subscriptions (user_id, area_id, enabled)
SELECT u.id, a.id, false
FROM app_users u
CROSS JOIN notification_areas a
WHERE a.slug = 'articulacao'
ON CONFLICT (user_id, area_id) DO NOTHING;

-- ── 1. Base Oficial dos 184 Municípios do Ceará ─────────────────────────────
CREATE TABLE IF NOT EXISTS ceara_municipalities (
  ibge_code    VARCHAR(7)  PRIMARY KEY,
  name         TEXT        NOT NULL UNIQUE,
  macro_region TEXT        NOT NULL,
  population   INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ce_mun_region ON ceara_municipalities (macro_region);
CREATE INDEX IF NOT EXISTS idx_ce_mun_name   ON ceara_municipalities (name);

INSERT INTO ceara_municipalities (ibge_code, name, macro_region, population) VALUES
  -- Grande Fortaleza (19)
  ('2304400', 'Fortaleza', 'Grande Fortaleza', 2428708),
  ('2303709', 'Caucaia', 'Grande Fortaleza', 355679),
  ('2307650', 'Maracanaú', 'Grande Fortaleza', 234509),
  ('2307700', 'Maranguape', 'Grande Fortaleza', 105093),
  ('2301000', 'Aquiraz', 'Grande Fortaleza', 80271),
  ('2309706', 'Pacatuba', 'Grande Fortaleza', 81638),
  ('2304285', 'Eusébio', 'Grande Fortaleza', 74170),
  ('2306256', 'Itaitinga', 'Grande Fortaleza', 69039),
  ('2304954', 'Guaiúba', 'Grande Fortaleza', 24311),
  ('2303501', 'Cascavel', 'Grande Fortaleza', 72706),
  ('2309607', 'Pacajus', 'Grande Fortaleza', 70983),
  ('2305233', 'Horizonte', 'Grande Fortaleza', 74755),
  ('2303956', 'Chorozinho', 'Grande Fortaleza', 20163),
  ('2310258', 'Paraipaba', 'Grande Fortaleza', 32135),
  ('2310209', 'Paracuru', 'Grande Fortaleza', 38980),
  ('2312403', 'São Gonçalo do Amarante', 'Grande Fortaleza', 54021),
  ('2312601', 'São Luís do Curu', 'Grande Fortaleza', 10822),
  ('2313500', 'Trairi', 'Grande Fortaleza', 58415),
  ('2309458', 'Pindoretama', 'Grande Fortaleza', 23391),
  -- Cariri (29)
  ('2307304', 'Juazeiro do Norte', 'Cariri', 286120),
  ('2304202', 'Crato', 'Cariri', 131050),
  ('2301901', 'Barbalha', 'Cariri', 75033),
  ('2302503', 'Brejo Santo', 'Cariri', 51090),
  ('2308401', 'Missão Velha', 'Cariri', 36822),
  ('2308104', 'Mauriti', 'Cariri', 45561),
  ('2308302', 'Milagres', 'Cariri', 25900),
  ('2307205', 'Jardim', 'Cariri', 27411),
  ('2303303', 'Caririaçu', 'Cariri', 26320),
  ('2304301', 'Farias Brito', 'Cariri', 18217),
  ('2313906', 'Várzea Alegre', 'Cariri', 38984),
  ('2301703', 'Aurora', 'Cariri', 23765),
  ('2302008', 'Barro', 'Cariri', 19832),
  ('2300101', 'Abaiara', 'Cariri', 10038),
  ('2300507', 'Altaneira', 'Cariri', 6782),
  ('2300705', 'Antonina do Norte', 'Cariri', 7245),
  ('2301307', 'Araripe', 'Cariri', 19783),
  ('2301604', 'Assaré', 'Cariri', 21613),
  ('2303006', 'Campos Sales', 'Cariri', 25135),
  ('2304707', 'Granjeiro', 'Cariri', 4841),
  ('2307106', 'Jati', 'Cariri', 7861),
  ('2309201', 'Nova Olinda', 'Cariri', 15399),
  ('2310605', 'Penaforte', 'Cariri', 8972),
  ('2310951', 'Porteiras', 'Cariri', 17050),
  ('2311207', 'Potengi', 'Cariri', 8833),
  ('2311959', 'Salitre', 'Cariri', 16633),
  ('2312106', 'Santana do Cariri', 'Cariri', 16954),
  ('2313252', 'Tarrafas', 'Cariri', 7529),
  ('2307502', 'Lavras da Mangabeira', 'Cariri', 30802),
  -- Región de Sobral (18)
  ('2312908', 'Sobral', 'Sobral', 203023),
  ('2307908', 'Massapê', 'Sobral', 37687),
  ('2312007', 'Santana do Acaraú', 'Sobral', 30628),
  ('2304509', 'Forquilha', 'Sobral', 24152),
  ('2303907', 'Coreaú', 'Sobral', 20953),
  ('2308203', 'Meruoca', 'Sobral', 15157),
  ('2311801', 'Reriutaba', 'Sobral', 18606),
  ('2313955', 'Varjota', 'Sobral', 18105),
  ('2305001', 'Groaíras', 'Sobral', 10910),
  ('2303402', 'Cariré', 'Sobral', 17632),
  ('2304608', 'Frecheirinha', 'Sobral', 15657),
  ('2304806', 'Graça', 'Sobral', 13801),
  ('2305308', 'Hidrolândia', 'Sobral', 17855),
  ('2308708', 'Moraújo', 'Sobral', 8256),
  ('2309003', 'Mucambo', 'Sobral', 13666),
  ('2309904', 'Pacujá', 'Sobral', 6145),
  ('2310902', 'Pires Ferreira', 'Sobral', 10606),
  ('2312809', 'Senador Sá', 'Sobral', 7262),
  -- Serra da Ibiapaba (9)
  ('2313401', 'Tianguá', 'Serra da Ibiapaba', 81506),
  ('2314102', 'Viçosa do Ceará', 'Serra da Ibiapaba', 59712),
  ('2312304', 'São Benedito', 'Serra da Ibiapaba', 47640),
  ('2305100', 'Guaraciaba do Norte', 'Serra da Ibiapaba', 42053),
  ('2305332', 'Ibiapina', 'Serra da Ibiapaba', 23965),
  ('2313609', 'Ubajara', 'Serra da Ibiapaba', 32767),
  ('2303600', 'Carnaubal', 'Serra da Ibiapaba', 17210),
  ('2304236', 'Croatá', 'Serra da Ibiapaba', 17481),
  ('2305902', 'Ipaporanga', 'Serra da Ibiapaba', 11575),
  -- Litoral Norte (13)
  ('2302602', 'Camocim', 'Litoral Norte', 62326),
  ('2300200', 'Acaraú', 'Litoral Norte', 65264),
  ('2306108', 'Itarema', 'Litoral Norte', 42730),
  ('2304657', 'Granja', 'Litoral Norte', 53344),
  ('2302206', 'Bela Cruz', 'Litoral Norte', 32775),
  ('2304251', 'Cruz', 'Litoral Norte', 29761),
  ('2307254', 'Jijoca de Jericoacoara', 'Litoral Norte', 25555),
  ('2307809', 'Marco', 'Litoral Norte', 25799),
  ('2308807', 'Morrinhos', 'Litoral Norte', 22753),
  ('2302057', 'Barroquinha', 'Litoral Norte', 14567),
  ('2303931', 'Chaval', 'Litoral Norte', 12462),
  ('2308005', 'Martinópole', 'Litoral Norte', 10845),
  ('2313807', 'Uruoca', 'Litoral Norte', 13746),
  -- Litoral Oeste / Vale do Curu (12)
  ('2306405', 'Itapipoca', 'Litoral Oeste / Vale do Curu', 131123),
  ('2306306', 'Itapajé', 'Litoral Oeste / Vale do Curu', 46426),
  ('2300606', 'Amontada', 'Litoral Oeste / Vale do Curu', 42156),
  ('2310704', 'Pentecoste', 'Litoral Oeste / Vale do Curu', 37813),
  ('2313757', 'Uruburetama', 'Litoral Oeste / Vale do Curu', 20189),
  ('2313559', 'Tururu', 'Litoral Oeste / Vale do Curu', 15412),
  ('2313708', 'Umirim', 'Litoral Oeste / Vale do Curu', 17470),
  ('2300903', 'Apuiarés', 'Litoral Oeste / Vale do Curu', 12928),
  ('2304558', 'General Sampaio', 'Litoral Oeste / Vale do Curu', 6734),
  ('2306603', 'Irauçuba', 'Litoral Oeste / Vale do Curu', 23915),
  ('2308377', 'Miraíma', 'Litoral Oeste / Vale do Curu', 14196),
  ('2313351', 'Tejuçuoca', 'Litoral Oeste / Vale do Curu', 17154),
  -- Maciço de Baturité (13)
  ('2302107', 'Baturité', 'Maciço de Baturité', 35218),
  ('2311603', 'Redenção', 'Maciço de Baturité', 27214),
  ('2300408', 'Acarape', 'Maciço de Baturité', 14027),
  ('2301208', 'Aracoiaba', 'Maciço de Baturité', 25553),
  ('2301802', 'Barreira', 'Maciço de Baturité', 22573),
  ('2309409', 'Ocara', 'Maciço de Baturité', 24493),
  ('2301406', 'Aratuba', 'Maciço de Baturité', 11224),
  ('2302909', 'Capistrano', 'Maciço de Baturité', 17254),
  ('2304905', 'Guaramiranga', 'Maciço de Baturité', 5654),
  ('2306504', 'Itapiúna', 'Maciço de Baturité', 17853),
  ('2309102', 'Mulungu', 'Maciço de Baturité', 10569),
  ('2309805', 'Pacoti', 'Maciço de Baturité', 11186),
  ('2310100', 'Palmácia', 'Maciço de Baturité', 10242),
  -- Litoral Leste (6)
  ('2301109', 'Aracati', 'Litoral Leste', 75113),
  ('2302305', 'Beberibe', 'Litoral Leste', 53114),
  ('2305357', 'Icapuí', 'Litoral Leste', 21354),
  ('2304459', 'Fortim', 'Litoral Leste', 17294),
  ('2306207', 'Itaiçaba', 'Litoral Leste', 7536),
  ('2306801', 'Jaguaruana', 'Litoral Leste', 31701),
  -- Vale do Jaguaribe (15)
  ('2311900', 'Russas', 'Vale do Jaguaribe', 72928),
  ('2307601', 'Limoeiro do Norte', 'Vale do Jaguaribe', 59560),
  ('2308906', 'Morada Nova', 'Vale do Jaguaribe', 61443),
  ('2313104', 'Tabuleiro do Norte', 'Vale do Jaguaribe', 31555),
  ('2306900', 'Jaguaribe', 'Vale do Jaguaribe', 33726),
  ('2300754', 'Alto Santo', 'Vale do Jaguaribe', 14155),
  ('2304277', 'Ereré', 'Vale do Jaguaribe', 6393),
  ('2305654', 'Iracema', 'Vale do Jaguaribe', 14001),
  ('2306702', 'Jaguaretama', 'Vale do Jaguaribe', 17232),
  ('2307007', 'Jaguaribara', 'Vale do Jaguaribe', 10356),
  ('2310001', 'Palhano', 'Vale do Jaguaribe', 9346),
  ('2310803', 'Pereiro', 'Vale do Jaguaribe', 15274),
  ('2311231', 'Potiretama', 'Vale do Jaguaribe', 5974),
  ('2311355', 'Quixeré', 'Vale do Jaguaribe', 20874),
  ('2312502', 'São João do Jaguaribe', 'Vale do Jaguaribe', 7621),
  -- Sertão Central (13)
  ('2311306', 'Quixadá', 'Sertão Central', 84168),
  ('2311405', 'Quixeramobim', 'Sertão Central', 82177),
  ('2302404', 'Boa Viagem', 'Sertão Central', 50411),
  ('2312700', 'Senador Pompeu', 'Sertão Central', 24266),
  ('2308500', 'Mombaça', 'Sertão Central', 37735),
  ('2310407', 'Pedra Branca', 'Sertão Central', 40187),
  ('2313005', 'Solonópole', 'Sertão Central', 18179),
  ('2301950', 'Banabuiú', 'Sertão Central', 17195),
  ('2303923', 'Choró', 'Sertão Central', 12113),
  ('2304269', 'Deputado Irapuan Pinheiro', 'Sertão Central', 8932),
  ('2305266', 'Ibaretama', 'Sertão Central', 11956),
  ('2308351', 'Milhã', 'Sertão Central', 13125),
  ('2310852', 'Piquet Carneiro', 'Sertão Central', 16616),
  -- Sertão de Canindé (6)
  ('2302800', 'Canindé', 'Sertão de Canindé', 74174),
  ('2312205', 'Santa Quitéria', 'Sertão de Canindé', 40183),
  ('2303105', 'Caridade', 'Sertão de Canindé', 22545),
  ('2306553', 'Itatira', 'Sertão de Canindé', 20424),
  ('2307551', 'Madalena', 'Sertão de Canindé', 16896),
  ('2310308', 'Paramoti', 'Sertão de Canindé', 10384),
  -- Sertão dos Crateús (12)
  ('2304103', 'Crateús', 'Sertão dos Crateús', 76390),
  ('2305803', 'Ipueiras', 'Sertão dos Crateús', 36798),
  ('2309300', 'Nova Russas', 'Sertão dos Crateús', 30699),
  ('2313203', 'Tamboril', 'Sertão dos Crateús', 24815),
  ('2305605', 'Independência', 'Sertão dos Crateús', 24024),
  ('2308609', 'Monsenhor Tabosa', 'Sertão dos Crateús', 17125),
  ('2309450', 'Novo Oriente', 'Sertão dos Crateús', 27545),
  ('2301505', 'Ararendá', 'Sertão dos Crateús', 11096),
  ('2303659', 'Catunda', 'Sertão dos Crateús', 10444),
  ('2305704', 'Ipu', 'Sertão dos Crateús', 41081),
  ('2311009', 'Poranga', 'Sertão dos Crateús', 12065),
  ('2311504', 'Quiterianópolis', 'Sertão dos Crateús', 20213),
  -- Sertão dos Inhamuns (5)
  ('2313302', 'Tauá', 'Sertão dos Inhamuns', 61227),
  ('2310200', 'Parambu', 'Sertão dos Inhamuns', 31445),
  ('2300309', 'Acopiara', 'Sertão dos Inhamuns', 44962),
  ('2300804', 'Arneiroz', 'Sertão dos Inhamuns', 7429),
  ('2301257', 'Aiuaba', 'Sertão dos Inhamuns', 14076),
  -- Centro-Sul (13)
  ('2305506', 'Iguatu', 'Centro-Sul', 98064),
  ('2305407', 'Icó', 'Centro-Sul', 62642),
  ('2303204', 'Cariús', 'Centro-Sul', 17015),
  ('2303808', 'Cedro', 'Centro-Sul', 22344),
  ('2307353', 'Jucás', 'Centro-Sul', 23922),
  ('2309508', 'Orós', 'Centro-Sul', 19675),
  ('2311264', 'Quixelô', 'Centro-Sul', 15910),
  ('2301851', 'Baixio', 'Centro-Sul', 5704),
  ('2303550', 'Catarina', 'Centro-Sul', 10243),
  ('2305621', 'Ipaumirim', 'Centro-Sul', 12083),
  ('2311950', 'Saboeiro', 'Centro-Sul', 13854),
  ('2313658', 'Umari', 'Centro-Sul', 6871),
  ('2312759', 'Senador Catunda / Alcântaras', 'Sobral', 11780),
  ('2300457', 'Alcântaras', 'Sobral', 11780)
ON CONFLICT DO NOTHING;

-- ── 2. Perfis de Prefeitos e Autoridades Municipais ────────────────────────
CREATE TABLE IF NOT EXISTS municipal_authorities (
  id                    SERIAL       PRIMARY KEY,
  municipality_ibge     VARCHAR(7)   REFERENCES ceara_municipalities(ibge_code) ON DELETE SET NULL,
  municipality_name     TEXT         NOT NULL,
  macro_region          TEXT,
  name                  TEXT         NOT NULL,
  role_type             TEXT         NOT NULL DEFAULT 'prefeito'
                        CHECK (role_type IN ('prefeito', 'vice_prefeito', 'secretario_municipal', 'vereador', 'lideranca')),
  party                 TEXT,
  allied_status         TEXT         NOT NULL DEFAULT 'base_elmano_luizianne'
                        CHECK (allied_status IN ('base_elmano_luizianne', 'aliado_prioritario', 'parceiro_institucional', 'em_articulacao')),
  mandate_period        TEXT         NOT NULL DEFAULT '2025-2028',
  phone_whatsapp        TEXT,
  email                 TEXT,
  cabinet_chief_name    TEXT,
  cabinet_chief_contact TEXT,
  senator_votes         INTEGER,
  priority_areas        TEXT[]       NOT NULL DEFAULT '{}',
  last_meeting_at       DATE,
  confidential_notes    TEXT,
  photo_url             TEXT,
  active                BOOLEAN      NOT NULL DEFAULT true,
  created_by            UUID         REFERENCES app_users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mun_auth_ibge   ON municipal_authorities (municipality_ibge);
CREATE INDEX IF NOT EXISTS idx_mun_auth_mun    ON municipal_authorities (municipality_name);
CREATE INDEX IF NOT EXISTS idx_mun_auth_status ON municipal_authorities (allied_status);
CREATE INDEX IF NOT EXISTS idx_mun_auth_party  ON municipal_authorities (party);
CREATE INDEX IF NOT EXISTS idx_mun_auth_active ON municipal_authorities (active);

CREATE OR REPLACE FUNCTION update_municipal_authorities_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_municipal_authorities_updated_at ON municipal_authorities;
CREATE TRIGGER trg_municipal_authorities_updated_at
  BEFORE UPDATE ON municipal_authorities
  FOR EACH ROW EXECUTE FUNCTION update_municipal_authorities_updated_at();

-- ── 3. Demandas de Prefeitos / Municípios (authority_demands) ─────────────
CREATE TABLE IF NOT EXISTS authority_demands (
  id                 SERIAL        PRIMARY KEY,
  authority_id       INTEGER       NOT NULL REFERENCES municipal_authorities(id) ON DELETE CASCADE,
  municipality_ibge  VARCHAR(7)    REFERENCES ceara_municipalities(ibge_code) ON DELETE SET NULL,
  municipality_name  TEXT          NOT NULL,
  title              TEXT          NOT NULL,
  description        TEXT,
  category           TEXT          NOT NULL DEFAULT 'infraestrutura',
  keywords           TEXT[]        NOT NULL DEFAULT '{}',
  target_ministry    TEXT,
  funding_type       TEXT          NOT NULL DEFAULT 'edital_federal'
                     CHECK (funding_type IN ('edital_federal', 'emenda_parlamentar', 'novo_pac', 'convenio_transferegov', 'articulacao_ministerial')),
  estimated_value    NUMERIC(15,2),
  protocol_number    TEXT,
  status             TEXT          NOT NULL DEFAULT 'mapeada'
                     CHECK (status IN ('mapeada', 'em_analise_tecnica', 'edital_identificado', 'proposta_submetida', 'em_empenho', 'atendida', 'arquivada')),
  priority           TEXT          NOT NULL DEFAULT 'normal'
                     CHECK (priority IN ('urgente', 'alta', 'normal', 'baixa')),
  assigned_to        UUID          REFERENCES app_users(id) ON DELETE SET NULL,
  due_date           DATE,
  confidential_notes TEXT,
  search_vector      tsvector,
  created_by         UUID          REFERENCES app_users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_demands_authority ON authority_demands (authority_id);
CREATE INDEX IF NOT EXISTS idx_auth_demands_category  ON authority_demands (category);
CREATE INDEX IF NOT EXISTS idx_auth_demands_status    ON authority_demands (status);
CREATE INDEX IF NOT EXISTS idx_auth_demands_priority  ON authority_demands (priority);
CREATE INDEX IF NOT EXISTS idx_auth_demands_fts       ON authority_demands USING GIN (search_vector);

CREATE OR REPLACE FUNCTION authority_demands_fts_trigger()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(array_to_string(NEW.keywords, ' '), '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.target_ministry, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_authority_demands_fts ON authority_demands;
CREATE TRIGGER trg_authority_demands_fts
  BEFORE INSERT OR UPDATE ON authority_demands
  FOR EACH ROW EXECUTE FUNCTION authority_demands_fts_trigger();

-- ── 4. Enriquecimento Profundo da Tabela editais + Full-Text Search ────────
ALTER TABLE editais ADD COLUMN IF NOT EXISTS categoria_tematica   TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS keywords_extraidas   TEXT[]  DEFAULT '{}';
ALTER TABLE editais ADD COLUMN IF NOT EXISTS publico_alvo         TEXT    DEFAULT 'licitacao_geral';
ALTER TABLE editais ADD COLUMN IF NOT EXISTS elegivel_prefeituras BOOLEAN DEFAULT false;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS abrangencia          TEXT    DEFAULT 'Nacional';
ALTER TABLE editais ADD COLUMN IF NOT EXISTS orgao_superior       TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS amparo_legal         TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS modo_disputa         TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS criterio_julgamento  TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS origem               TEXT    DEFAULT 'PNCP';
ALTER TABLE editais ADD COLUMN IF NOT EXISTS itens_resumo         JSONB;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS arquivos_anexos      JSONB;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS search_vector        tsvector;

CREATE INDEX IF NOT EXISTS idx_editais_categoria  ON editais (categoria_tematica);
CREATE INDEX IF NOT EXISTS idx_editais_elegivel   ON editais (elegivel_prefeituras, situacao);
CREATE INDEX IF NOT EXISTS idx_editais_uf_sit     ON editais (uf, situacao);
CREATE INDEX IF NOT EXISTS idx_editais_fts        ON editais USING GIN (search_vector);

CREATE OR REPLACE FUNCTION editais_fts_trigger()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.titulo, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.objeto, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.categoria_tematica, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.orgao, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.ministerio, '')), 'C') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.municipio, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_editais_updated_at ON editais;
DROP TRIGGER IF EXISTS trg_editais_fts ON editais;
CREATE TRIGGER trg_editais_fts
  BEFORE INSERT OR UPDATE ON editais
  FOR EACH ROW EXECUTE FUNCTION editais_fts_trigger();

-- Backfill search_vector em editais já existentes
UPDATE editais SET updated_at = updated_at WHERE search_vector IS NULL;

-- ── 5. Tabela de Traqueamento / Matchmaking (Edital x Prefeito x Demanda) ──
CREATE TABLE IF NOT EXISTS edital_authority_tracking (
  id                 SERIAL       PRIMARY KEY,
  edital_id          INTEGER      NOT NULL REFERENCES editais(id) ON DELETE CASCADE,
  authority_id       INTEGER      NOT NULL REFERENCES municipal_authorities(id) ON DELETE CASCADE,
  demand_id          INTEGER      REFERENCES authority_demands(id) ON DELETE SET NULL,
  match_score        INTEGER      NOT NULL DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  match_reasons      JSONB        NOT NULL DEFAULT '[]'::jsonb,
  tracking_status    TEXT         NOT NULL DEFAULT 'sugerido'
                     CHECK (tracking_status IN (
                       'sugerido',
                       'em_avaliacao',
                       'prefeito_notificado',
                       'elaborando_projeto',
                       'proposta_enviada',
                       'contemplado',
                       'descartado'
                     )),
  notified_at        TIMESTAMPTZ,
  notified_by        UUID         REFERENCES app_users(id) ON DELETE SET NULL,
  protocol_submitted TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_edital_auth_track_uniq
  ON edital_authority_tracking (edital_id, authority_id, COALESCE(demand_id, 0));

CREATE INDEX IF NOT EXISTS idx_edital_auth_track_edital    ON edital_authority_tracking (edital_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_edital_auth_track_authority ON edital_authority_tracking (authority_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_edital_auth_track_status    ON edital_authority_tracking (tracking_status);

CREATE OR REPLACE FUNCTION update_edital_tracking_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_edital_tracking_updated_at ON edital_authority_tracking;
CREATE TRIGGER trg_edital_tracking_updated_at
  BEFORE UPDATE ON edital_authority_tracking
  FOR EACH ROW EXECUTE FUNCTION update_edital_tracking_updated_at();

-- ── 6. Índice Único em v_coauthorship_edges para REFRESH CONCURRENTLY ─────
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_coauth_uniq
  ON v_coauthorship_edges (deputy_a, deputy_b);
