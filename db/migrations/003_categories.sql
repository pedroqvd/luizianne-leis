-- ============================================================
-- 003_categories.sql
-- Suporte a classificação por NLP/heurística e relacionamento
-- many-to-many entre proposições e categorias.
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    slug        TEXT UNIQUE NOT NULL,
    label       TEXT NOT NULL,
    description TEXT
);

INSERT INTO categories (slug, label, description) VALUES
    ('saude',         'Saúde',                    'Sistema Único de Saúde, hospitais, vacinas, atenção básica'),
    ('educacao',      'Educação',                 'Ensino, universidades, FUNDEB, alfabetização'),
    ('seguranca',     'Segurança Pública',        'Polícia, violência, sistema penitenciário'),
    ('economia',      'Economia & Trabalho',      'Empregos, salários, impostos, micro/pequena empresa'),
    ('direitos',      'Direitos Humanos',         'Igualdade de gênero, racial, LGBTQIA+, povos tradicionais'),
    ('ambiente',      'Meio Ambiente',            'Clima, desmatamento, saneamento'),
    ('habitacao',     'Habitação & Cidades',      'Moradia, urbanização, transporte público'),
    ('cultura',       'Cultura',                  'Patrimônio, fomento, lei rouanet'),
    ('infraestrutura','Infraestrutura',           'Obras, energia, telecomunicações'),
    ('outros',        'Outros',                   'Sem classificação definida')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS proposition_categories (
    proposition_id  INTEGER NOT NULL REFERENCES propositions(id) ON DELETE CASCADE,
    category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    score           NUMERIC(5,4) NOT NULL DEFAULT 0,
    classifier      TEXT NOT NULL DEFAULT 'heuristic',
    classified_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (proposition_id, category_id, classifier)
);

CREATE INDEX IF NOT EXISTS idx_pc_category ON proposition_categories (category_id);
CREATE INDEX IF NOT EXISTS idx_pc_score ON proposition_categories (score DESC);

-- View: contagem por categoria para o dashboard
CREATE OR REPLACE VIEW v_categories_breakdown AS
SELECT
    c.id, c.slug, c.label,
    COUNT(DISTINCT pc.proposition_id)::int AS total
FROM categories c
LEFT JOIN proposition_categories pc ON pc.category_id = c.id
GROUP BY c.id;
