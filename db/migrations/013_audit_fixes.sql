-- Migration 013: Audit Fixes
-- 1. Full Text Search for Propositions (fixes slow ILIKE queries)
-- 2. Outbox pattern table for atomic event emission

-- 1. FTS
ALTER TABLE propositions ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search_vector
CREATE OR REPLACE FUNCTION propositions_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.summary,'')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS tsvectorupdate ON propositions;
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON propositions FOR EACH ROW EXECUTE FUNCTION propositions_search_vector_update();

-- Backfill existing rows
UPDATE propositions SET updated_at = updated_at WHERE search_vector IS NULL;

-- Create GIN index
CREATE INDEX IF NOT EXISTS propositions_search_idx ON propositions USING GIN (search_vector);


-- 2. Outbox Table
CREATE TABLE IF NOT EXISTS outbox_events (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id INT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX IF NOT EXISTS outbox_events_unprocessed_idx ON outbox_events (created_at) WHERE processed_at IS NULL;
