# Supabase — Schema SQL + Configuración

## SQL para las columnas que faltan (VOs no persisten, pero sí índices)

```sql
-- ────────────────────────────────────────────────────────────
-- Ajustes sobre las tablas que ya tenés creadas
-- Ejecutar en Supabase SQL Editor
-- ────────────────────────────────────────────────────────────

-- 1. Tabla movimientos_importados (nueva — para el sistema de importación)
CREATE TABLE IF NOT EXISTS movimientos_importados (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hash_dedup      CHAR(16)    NOT NULL,
  origen          TEXT        NOT NULL CHECK (origen IN ('NaranjaX','BBVA','MercadoPago','Manual')),
  fecha           DATE        NOT NULL,
  descripcion     TEXT        NOT NULL,
  monto_ars       NUMERIC(18,2) NOT NULL,
  cuota_actual    INT,
  cuotas_total    INT,
  estado_revision TEXT        NOT NULL DEFAULT 'Pendiente'
                              CHECK (estado_revision IN ('Pendiente','Confirmado','Descartado')),
  gasto_id        UUID        REFERENCES gastos(id),
  importado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archivo_origen  TEXT
);

-- Índice único — la red de seguridad contra duplicados
CREATE UNIQUE INDEX IF NOT EXISTS ix_movimientos_dedup
  ON movimientos_importados (hash_dedup);

-- Índice para filtrar pendientes rápido
CREATE INDEX IF NOT EXISTS ix_movimientos_estado
  ON movimientos_importados (estado_revision)
  WHERE estado_revision = 'Pendiente';

-- ────────────────────────────────────────────────────────────
-- 2. Verificar que gastos tiene todos los campos necesarios
-- (Si ya los tenés, estos ALTER se ignorarán con IF NOT EXISTS)
-- ────────────────────────────────────────────────────────────

ALTER TABLE gastos
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

-- ────────────────────────────────────────────────────────────
-- 3. Índices de performance para las queries más comunes
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS ix_gastos_activo
  ON gastos (activo) WHERE activo = true;

CREATE INDEX IF NOT EXISTS ix_ingresos_periodo
  ON ingresos (periodo);

CREATE INDEX IF NOT EXISTS ix_gastos_tarjeta
  ON gastos (tarjeta_id) WHERE tarjeta_id IS NOT NULL;
```

---

## Tipos generados desde Supabase

Ejecutá este comando para generar los tipos TypeScript automáticamente:

```bash
npx supabase gen types typescript \
  --project-id TU_PROJECT_ID \
  --schema public \
  > src/types/database.types.ts
```

Esto genera el archivo `database.types.ts` con tipado exacto de cada tabla.
Cada vez que modifiques el schema en Supabase, volvé a ejecutarlo.

---

## Row Level Security (RLS)

Como el sistema es solo para vos y usás la `service_role` key en el backend,
el RLS no bloquea nada. Pero por buenas prácticas, dejalo así:

```sql
-- Deshabilitado en todas las tablas del sistema
-- (el backend usa service_role, que bypasea RLS)
ALTER TABLE gastos               DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos             DISABLE ROW LEVEL SECURITY;
ALTER TABLE tarjetas             DISABLE ROW LEVEL SECURITY;
ALTER TABLE periodos_mensuales   DISABLE ROW LEVEL SECURITY;
ALTER TABLE deudas_extra         DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_importados DISABLE ROW LEVEL SECURITY;
```

---

## Variables de entorno

### Backend (.env)
```
PORT=3000
SUPABASE_URL=https://XXXXXXXX.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  ← del panel Settings > API > service_role

# Google Drive (opcional, para sync automático NaranjaX)
GOOGLE_DRIVE_FOLDER_ID=1abc...
GOOGLE_CLIENT_EMAIL=finanzas@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

FRONTEND_URL=http://localhost:4200
```

### Frontend (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
}
```
