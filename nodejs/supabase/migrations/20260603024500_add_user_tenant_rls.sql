-- Multi-tenant: cada fila pertenece a un usuario (auth.users).
-- Filas existentes sin user_id quedan invisibles hasta asignarlas o borrarlas.
--
-- Reversión (referencia):
--   DROP POLICY ... ; ALTER TABLE ... DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE ... DROP COLUMN user_id;

-- ── user_id en todas las tablas de negocio ───────────────────────────────────

ALTER TABLE public.gastos
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE public.ingresos
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE public.periodos_mensuales
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE public.deudas_extra
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE public.tarjetas
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE public.movimientos_importados
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE public.gastos ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.ingresos ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.periodos_mensuales ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.deudas_extra ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.tarjetas ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.movimientos_importados ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Períodos únicos por usuario (antes era global anio+mes)
ALTER TABLE public.periodos_mensuales
  DROP CONSTRAINT IF EXISTS uq_periodos_anio_mes;
ALTER TABLE public.periodos_mensuales
  DROP CONSTRAINT IF EXISTS uq_periodos_user_anio_mes;
ALTER TABLE public.periodos_mensuales
  ADD CONSTRAINT uq_periodos_user_anio_mes UNIQUE (user_id, anio, mes);

CREATE INDEX IF NOT EXISTS ix_gastos_user_id ON public.gastos (user_id);
CREATE INDEX IF NOT EXISTS ix_ingresos_user_id ON public.ingresos (user_id);
CREATE INDEX IF NOT EXISTS ix_periodos_user_id ON public.periodos_mensuales (user_id);
CREATE INDEX IF NOT EXISTS ix_deudas_extra_user_id ON public.deudas_extra (user_id);
CREATE INDEX IF NOT EXISTS ix_tarjetas_user_id ON public.tarjetas (user_id);
CREATE INDEX IF NOT EXISTS ix_movimientos_user_id ON public.movimientos_importados (user_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodos_mensuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deudas_extra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarjetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_importados ENABLE ROW LEVEL SECURITY;

-- gastos
DROP POLICY IF EXISTS gastos_select_own ON public.gastos;
DROP POLICY IF EXISTS gastos_insert_own ON public.gastos;
DROP POLICY IF EXISTS gastos_update_own ON public.gastos;
DROP POLICY IF EXISTS gastos_delete_own ON public.gastos;
CREATE POLICY gastos_select_own ON public.gastos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY gastos_insert_own ON public.gastos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY gastos_update_own ON public.gastos FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY gastos_delete_own ON public.gastos FOR DELETE USING (auth.uid() = user_id);

-- ingresos
DROP POLICY IF EXISTS ingresos_select_own ON public.ingresos;
DROP POLICY IF EXISTS ingresos_insert_own ON public.ingresos;
DROP POLICY IF EXISTS ingresos_update_own ON public.ingresos;
DROP POLICY IF EXISTS ingresos_delete_own ON public.ingresos;
CREATE POLICY ingresos_select_own ON public.ingresos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ingresos_insert_own ON public.ingresos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ingresos_update_own ON public.ingresos FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY ingresos_delete_own ON public.ingresos FOR DELETE USING (auth.uid() = user_id);

-- periodos_mensuales
DROP POLICY IF EXISTS periodos_select_own ON public.periodos_mensuales;
DROP POLICY IF EXISTS periodos_insert_own ON public.periodos_mensuales;
DROP POLICY IF EXISTS periodos_update_own ON public.periodos_mensuales;
DROP POLICY IF EXISTS periodos_delete_own ON public.periodos_mensuales;
CREATE POLICY periodos_select_own ON public.periodos_mensuales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY periodos_insert_own ON public.periodos_mensuales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY periodos_update_own ON public.periodos_mensuales FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY periodos_delete_own ON public.periodos_mensuales FOR DELETE USING (auth.uid() = user_id);

-- deudas_extra
DROP POLICY IF EXISTS deudas_select_own ON public.deudas_extra;
DROP POLICY IF EXISTS deudas_insert_own ON public.deudas_extra;
DROP POLICY IF EXISTS deudas_update_own ON public.deudas_extra;
DROP POLICY IF EXISTS deudas_delete_own ON public.deudas_extra;
CREATE POLICY deudas_select_own ON public.deudas_extra FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY deudas_insert_own ON public.deudas_extra FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY deudas_update_own ON public.deudas_extra FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY deudas_delete_own ON public.deudas_extra FOR DELETE USING (auth.uid() = user_id);

-- tarjetas
DROP POLICY IF EXISTS tarjetas_select_own ON public.tarjetas;
DROP POLICY IF EXISTS tarjetas_insert_own ON public.tarjetas;
DROP POLICY IF EXISTS tarjetas_update_own ON public.tarjetas;
DROP POLICY IF EXISTS tarjetas_delete_own ON public.tarjetas;
CREATE POLICY tarjetas_select_own ON public.tarjetas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tarjetas_insert_own ON public.tarjetas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tarjetas_update_own ON public.tarjetas FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tarjetas_delete_own ON public.tarjetas FOR DELETE USING (auth.uid() = user_id);

-- movimientos_importados
DROP POLICY IF EXISTS movimientos_select_own ON public.movimientos_importados;
DROP POLICY IF EXISTS movimientos_insert_own ON public.movimientos_importados;
DROP POLICY IF EXISTS movimientos_update_own ON public.movimientos_importados;
DROP POLICY IF EXISTS movimientos_delete_own ON public.movimientos_importados;
CREATE POLICY movimientos_select_own ON public.movimientos_importados FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY movimientos_insert_own ON public.movimientos_importados FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY movimientos_update_own ON public.movimientos_importados FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY movimientos_delete_own ON public.movimientos_importados FOR DELETE USING (auth.uid() = user_id);
