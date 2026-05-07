-- ============================================================
-- 010_fix_notification_areas.sql
-- FIX #24 (BAIXO): Adiciona área 'ausencias' que faltava na seed
-- original (004_auth.sql). O NotificationsListener usa essa área
-- para enviar e-mails de ausência, mas ela nunca existiu.
-- ============================================================

INSERT INTO notification_areas (slug, label, description) VALUES
  ('ausencias', 'Ausências', 'Ausências da deputada em votações nominais')
ON CONFLICT (slug) DO NOTHING;
