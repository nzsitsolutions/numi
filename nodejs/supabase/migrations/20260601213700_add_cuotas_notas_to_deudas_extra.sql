-- ────────────────────────────────────────────────────────────
-- Agrega soporte de cuotas y notas a la tabla deudas_extra
--
-- Para revertir esta migración, crear:
-- 20260601XXXXXX_revert_cuotas_notas_from_deudas_extra.sql
-- con el siguiente contenido:
--   ALTER TABLE public.deudas_extra
--     DROP COLUMN IF EXISTS cuotas_total,
--     DROP COLUMN IF EXISTS cuotas_pagadas,
--     DROP COLUMN IF EXISTS notas;
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.deudas_extra
  ADD COLUMN IF NOT EXISTS cuotas_total   INTEGER,
  ADD COLUMN IF NOT EXISTS cuotas_pagadas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notas          TEXT;
