-- Migration 016: Fix cod_documento and cod_lote column types in ceap_despesas
-- The Câmara API recently started returning UUID strings for some documents,
-- which are incompatible with the previous BIGINT type.

ALTER TABLE ceap_despesas
  ALTER COLUMN cod_documento TYPE TEXT USING cod_documento::TEXT,
  ALTER COLUMN cod_lote       TYPE TEXT USING cod_lote::TEXT;
