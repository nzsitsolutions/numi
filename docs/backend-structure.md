# Backend — Node.js + TypeScript

## Estructura de carpetas

```
backend/
├── src/
│   ├── config/
│   │   ├── supabase.ts          # Cliente Supabase singleton
│   │   └── env.ts               # Variables de entorno tipadas
│   │
│   ├── types/
│   │   ├── database.types.ts    # Tipos generados desde Supabase (supabase gen types)
│   │   ├── domain.types.ts      # Tipos de dominio: enums, VOs calculados
│   │   └── api.types.ts         # Request/Response DTOs
│   │
│   ├── routes/
│   │   ├── index.ts             # Router raíz — monta todos los sub-routers
│   │   ├── gastos.routes.ts
│   │   ├── ingresos.routes.ts
│   │   ├── tarjetas.routes.ts
│   │   ├── periodos.routes.ts
│   │   ├── deudas.routes.ts
│   │   └── importaciones.routes.ts
│   │
│   ├── controllers/
│   │   ├── gastos.controller.ts
│   │   ├── ingresos.controller.ts
│   │   ├── tarjetas.controller.ts
│   │   ├── periodos.controller.ts
│   │   ├── deudas.controller.ts
│   │   └── importaciones.controller.ts
│   │
│   ├── services/
│   │   ├── gastos.service.ts
│   │   ├── ingresos.service.ts
│   │   ├── tarjetas.service.ts
│   │   ├── periodos.service.ts
│   │   ├── deudas.service.ts
│   │   ├── resumen.service.ts       # KPIs del panel lateral
│   │   └── importaciones/
│   │       ├── importacion.service.ts    # Orquestador
│   │       ├── deduplicacion.service.ts  # Hash SHA256
│   │       ├── naranjax.parser.ts        # Parser PDF Naranja X
│   │       └── drive.service.ts          # Google Drive watcher
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts     # Valida JWT de Supabase Auth
│   │   ├── validate.middleware.ts # Zod validation wrapper
│   │   └── error.middleware.ts    # Global error handler
│   │
│   ├── utils/
│   │   ├── hash.ts               # Generador de hash dedup
│   │   ├── moneda.ts             # Formateo ARS/USD
│   │   └── fecha.ts              # Helpers de fecha argentina
│   │
│   └── app.ts                    # Express app setup
│
├── package.json
├── tsconfig.json
└── .env
```

---

## config/supabase.ts

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'
import { env } from './env'

// Un único cliente para todo el backend — usa la service_role key
// para tener acceso completo sin RLS (esto es un sistema privado tuyo)
export const supabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)
```

## config/env.ts

```typescript
import { z } from 'zod'

const schema = z.object({
  PORT:                      z.string().default('3000'),
  SUPABASE_URL:              z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GOOGLE_DRIVE_FOLDER_ID:   z.string().optional(),
  GOOGLE_CLIENT_EMAIL:      z.string().optional(),
  GOOGLE_PRIVATE_KEY:       z.string().optional(),
  FRONTEND_URL:             z.string().default('http://localhost:4200'),
})

export const env = schema.parse(process.env)
```

---

## types/domain.types.ts

```typescript
// Enums
export type TipoGasto = 'Fijo' | 'Cuotas'
export type Moneda    = 'ARS'  | 'USD'
export type OrigenImportacion = 'NaranjaX' | 'BBVA' | 'MercadoPago' | 'Manual'
export type EstadoRevision    = 'Pendiente' | 'Confirmado' | 'Descartado'

// Value Objects calculados — nunca persisten en DB, se calculan en service
export interface GastoCalculado {
  cuotasRestantes:    number
  montoTotalRestante: number
  totalAPagar:        number
  avancePorcentaje:   number  // 0-100
}

// Lo que devuelve el GET /gastos — row de DB + VOs calculados
export interface GastoConCalculo {
  id:              string
  nombre:          string
  tipo:            TipoGasto
  cuotasTotal:     number | null
  cuotasPagadas:   number
  montoARS:        number
  montoUSD:        number
  tarjetaId:       string | null
  fechaInicio:     string
  activo:          boolean
  // VOs calculados en backend:
  cuotasRestantes:    number
  montoTotalRestante: number
  totalAPagar:        number
  avancePorcentaje:   number
}

// KPIs del panel lateral
export interface ResumenMensual {
  valorUSD:            number   // tipo de cambio del período
  totalMensualARS:     number   // gastos fijos ARS
  totalMensualUSD:     number   // gastos en USD (Spotify, Claude, etc.)
  totalMesARS:         number   // todo convertido a ARS
  sinDeudasARS:        number   // gastos sin tarjeta
  cierreTotalARS:      number   // suma de todo el mes
  tarjetasMensualARS:  number
  noTarjetasMensualARS:number
  totalIngresosARS:    number
  totalIngresosUSD:    number
  tarjetas: {
    id:       string
    nombre:   string
    limiteUSD:number
    usadoUSD: number
    diaCierre:number
  }[]
  deudasExtras: {
    descripcion: string
    monto:       number
    moneda:      Moneda
  }[]
}
```

## types/api.types.ts

```typescript
// ─── REQUEST DTOs ───────────────────────────────────────────

export interface CreateGastoDto {
  nombre:        string
  tipo:          'Fijo' | 'Cuotas'
  cuotasTotal?:  number
  cuotasPagadas: number
  montoARS:      number
  montoUSD?:     number
  tarjetaId?:    string
  fechaInicio:   string  // ISO date "2025-01-15"
}

export interface UpdateGastoDto extends Partial<CreateGastoDto> {}

export interface CreateIngresoDto {
  descripcion: string
  montoARS:    number
  montoUSD?:   number
  moneda:      'ARS' | 'USD'
  periodo:     string  // "2025-05"
}

// ─── RESPONSE DTOs ──────────────────────────────────────────

export interface ApiResponse<T> {
  data:    T
  message?: string
}

export interface ApiError {
  error:   string
  details?: unknown
}

export interface ImportacionResultDto {
  totalEnArchivo: number
  nuevos:         number
  duplicados:     number
  errores:        number
}
```

---

## routes/index.ts

```typescript
import { Router } from 'express'
import gastosRouter        from './gastos.routes'
import ingresosRouter      from './ingresos.routes'
import tarjetasRouter      from './tarjetas.routes'
import periodosRouter      from './periodos.routes'
import deudasRouter        from './deudas.routes'
import importacionesRouter from './importaciones.routes'

const router = Router()

router.use('/gastos',        gastosRouter)
router.use('/ingresos',      ingresosRouter)
router.use('/tarjetas',      tarjetasRouter)
router.use('/periodos',      periodosRouter)
router.use('/deudas',        deudasRouter)
router.use('/importaciones', importacionesRouter)

export default router
```

## routes/gastos.routes.ts

```typescript
import { Router } from 'express'
import { GastosController } from '../controllers/gastos.controller'
import { validateBody } from '../middleware/validate.middleware'
import { createGastoSchema, updateGastoSchema } from '../validators/gastos.validator'

const router = Router()
const ctrl   = new GastosController()

router.get('/',           ctrl.getAll)        // GET  /api/gastos?periodo=2025-05
router.get('/:id',        ctrl.getById)       // GET  /api/gastos/:id
router.post('/',          validateBody(createGastoSchema), ctrl.create)
router.patch('/:id',      validateBody(updateGastoSchema), ctrl.update)
router.delete('/:id',     ctrl.remove)
router.post('/:id/pagar-cuota', ctrl.pagarCuota)  // Incrementa cuotasPagadas

export default router
```

## routes/periodos.routes.ts

```typescript
import { Router } from 'express'
import { PeriodosController } from '../controllers/periodos.controller'

const router = Router()
const ctrl   = new PeriodosController()

router.get('/',                        ctrl.getAll)
router.get('/:anio/:mes',              ctrl.getOne)
router.get('/:anio/:mes/resumen',      ctrl.getResumen)  // KPIs del panel lateral
router.post('/',                       ctrl.create)
router.patch('/:anio/:mes/tipo-cambio', ctrl.updateTipoCambio)

export default router
```

## routes/importaciones.routes.ts

```typescript
import { Router } from 'express'
import multer from 'multer'
import { ImportacionesController } from '../controllers/importaciones.controller'

const router  = Router()
const ctrl    = new ImportacionesController()
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10_000_000 } })

// Upload directo desde el browser
router.post('/naranjax/upload',     upload.single('archivo'), ctrl.uploadNaranjaX)

// Trigger manual del watcher de Drive
router.post('/naranjax/drive-sync', ctrl.syncDriveNaranjaX)

// Mercado Pago API
router.post('/mercadopago/sync',    ctrl.syncMercadoPago)

// Revisar pendientes
router.get('/pendientes',           ctrl.getPendientes)
router.patch('/:id/confirmar',      ctrl.confirmar)
router.patch('/:id/descartar',      ctrl.descartar)

export default router
```

---

## services/gastos.service.ts

```typescript
import { supabase } from '../config/supabase'
import { GastoConCalculo } from '../types/domain.types'
import { CreateGastoDto, UpdateGastoDto } from '../types/api.types'

export class GastosService {

  // Calcula los VOs en memoria — nunca los persiste
  private calcularVOs(gasto: any): GastoConCalculo {
    const esFijo = gasto.tipo === 'Fijo'

    const cuotasRestantes = esFijo
      ? 1
      : (gasto.cuotas_total ?? 0) - gasto.cuotas_pagadas

    const montoTotalRestante = esFijo
      ? gasto.monto_ars
      : gasto.monto_ars * cuotasRestantes

    const totalAPagar = esFijo
      ? gasto.monto_ars
      : gasto.monto_ars * (gasto.cuotas_total ?? 0)

    const avancePorcentaje = gasto.cuotas_total && gasto.cuotas_total > 0
      ? (gasto.cuotas_pagadas / gasto.cuotas_total) * 100
      : gasto.cuotas_pagadas > 0 ? 100 : 0

    return {
      id:              gasto.id,
      nombre:          gasto.nombre,
      tipo:            gasto.tipo,
      cuotasTotal:     gasto.cuotas_total,
      cuotasPagadas:   gasto.cuotas_pagadas,
      montoARS:        gasto.monto_ars,
      montoUSD:        gasto.monto_usd,
      tarjetaId:       gasto.tarjeta_id,
      fechaInicio:     gasto.fecha_inicio,
      activo:          gasto.activo,
      cuotasRestantes,
      montoTotalRestante,
      totalAPagar,
      avancePorcentaje: Math.round(avancePorcentaje * 100) / 100,
    }
  }

  async getAll(periodo?: string): Promise<GastoConCalculo[]> {
    const { data, error } = await supabase
      .from('gastos')
      .select('*, tarjetas(nombre)')
      .eq('activo', true)
      .order('nombre')

    if (error) throw new Error(error.message)
    return (data ?? []).map(g => this.calcularVOs(g))
  }

  async getById(id: string): Promise<GastoConCalculo | null> {
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return this.calcularVOs(data)
  }

  async create(dto: CreateGastoDto) {
    const { data, error } = await supabase
      .from('gastos')
      .insert({
        nombre:         dto.nombre,
        tipo:           dto.tipo,
        cuotas_total:   dto.cuotasTotal,
        cuotas_pagadas: dto.cuotasPagadas,
        monto_ars:      dto.montoARS,
        monto_usd:      dto.montoUSD ?? 0,
        tarjeta_id:     dto.tarjetaId,
        fecha_inicio:   dto.fechaInicio,
        activo:         true,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return this.calcularVOs(data)
  }

  async pagarCuota(id: string) {
    // Primero busca el gasto actual
    const gasto = await this.getById(id)
    if (!gasto) throw new Error('Gasto no encontrado')
    if (gasto.tipo === 'Fijo') throw new Error('Los gastos fijos no tienen cuotas')
    if (gasto.cuotasPagadas >= (gasto.cuotasTotal ?? 0)) {
      throw new Error('Ya se pagaron todas las cuotas')
    }

    const { data, error } = await supabase
      .from('gastos')
      .update({ cuotas_pagadas: gasto.cuotasPagadas + 1 })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return this.calcularVOs(data)
  }

  async update(id: string, dto: UpdateGastoDto) {
    const { data, error } = await supabase
      .from('gastos')
      .update({
        ...(dto.nombre        && { nombre:         dto.nombre }),
        ...(dto.montoARS      && { monto_ars:       dto.montoARS }),
        ...(dto.cuotasPagadas !== undefined && { cuotas_pagadas: dto.cuotasPagadas }),
        ...(dto.tarjetaId     !== undefined && { tarjeta_id:     dto.tarjetaId }),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return this.calcularVOs(data)
  }

  async remove(id: string) {
    // Soft delete — nunca borramos datos financieros
    const { error } = await supabase
      .from('gastos')
      .update({ activo: false })
      .eq('id', id)

    if (error) throw new Error(error.message)
  }
}
```

## services/resumen.service.ts

```typescript
import { supabase } from '../config/supabase'
import { ResumenMensual } from '../types/domain.types'

export class ResumenService {

  async getResumenMensual(anio: number, mes: number): Promise<ResumenMensual> {
    // Carga en paralelo todo lo que necesita
    const [gastos, ingresos, tarjetas, periodo, deudas] = await Promise.all([
      supabase.from('gastos').select('*, tarjetas(*)').eq('activo', true),
      supabase.from('ingresos').select('*').eq('periodo', `${anio}-${String(mes).padStart(2,'0')}`),
      supabase.from('tarjetas').select('*'),
      supabase.from('periodos_mensuales').select('*').eq('anio', anio).eq('mes', mes).single(),
      supabase.from('deudas_extra').select('*').eq('estado', 'Activa'),
    ])

    const tipoCambio = periodo.data?.tipo_cambio ?? 1

    const gastosData  = gastos.data  ?? []
    const ingresosData= ingresos.data ?? []
    const tarjetasData= tarjetas.data ?? []
    const deudasData  = deudas.data  ?? []

    // Calcula cuota mensual de cada gasto (lo que paga este mes)
    const cuotaMensual = (g: any): number => {
      if (g.tipo === 'Fijo') return g.monto_ars + (g.monto_usd * tipoCambio)
      const restantes = (g.cuotas_total ?? 0) - g.cuotas_pagadas
      if (restantes <= 0) return 0
      return g.monto_ars
    }

    const gastosConTarjeta    = gastosData.filter(g => g.tarjeta_id)
    const gastosSinTarjeta    = gastosData.filter(g => !g.tarjeta_id)

    const tarjetasMensualARS  = gastosConTarjeta.reduce((s, g) => s + cuotaMensual(g), 0)
    const noTarjetasMensualARS= gastosSinTarjeta.reduce((s, g) => s + cuotaMensual(g), 0)

    // Gastos en USD (los que tienen monto_usd > 0 y monto_ars = 0)
    const totalMensualUSD = gastosData
      .filter(g => g.monto_usd > 0 && g.monto_ars === 0)
      .reduce((s, g) => s + g.monto_usd, 0)

    const totalMensualARS = gastosData
      .filter(g => g.monto_ars > 0)
      .reduce((s, g) => s + cuotaMensual(g), 0)

    // Ingresos
    const totalIngresosARS = ingresosData.reduce((s, i) => s + i.monto_ars, 0)
    const totalIngresosUSD = ingresosData.reduce((s, i) => s + (i.monto_usd ?? 0), 0)

    return {
      valorUSD:             tipoCambio,
      totalMensualARS,
      totalMensualUSD,
      totalMesARS:          totalMensualARS + (totalMensualUSD * tipoCambio),
      sinDeudasARS:         noTarjetasMensualARS,
      cierreTotalARS:       tarjetasMensualARS + noTarjetasMensualARS,
      tarjetasMensualARS,
      noTarjetasMensualARS,
      totalIngresosARS,
      totalIngresosUSD,
      tarjetas: tarjetasData.map(t => ({
        id:        t.id,
        nombre:    t.nombre,
        limiteUSD: t.limite_usd,
        usadoUSD:  gastosConTarjeta
          .filter(g => g.tarjeta_id === t.id)
          .reduce((s, g) => s + (g.monto_usd > 0 ? g.monto_usd : g.monto_ars / tipoCambio), 0),
        diaCierre: t.dia_cierre,
      })),
      deudasExtras: deudasData.map(d => ({
        descripcion: d.descripcion,
        monto:       d.monto,
        moneda:      d.moneda,
      })),
    }
  }
}
```

## services/importaciones/deduplicacion.service.ts

```typescript
import { createHash } from 'crypto'
import { supabase } from '../../config/supabase'

export interface MovimientoRaw {
  fecha:       string   // "2025-05-15"
  descripcion: string
  montoARS:    number
  cuotaActual: number | null
  origen:      string
}

export class DeduplicacionService {

  generarHash(m: MovimientoRaw): string {
    const descripcionNorm = m.descripcion
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' ')

    const clave = `${m.fecha}|${descripcionNorm}|${m.montoARS.toFixed(2)}|${m.cuotaActual ?? 0}`
    return createHash('sha256').update(clave).digest('hex').slice(0, 16)
  }

  async filtrarNuevos(movimientos: MovimientoRaw[]): Promise<{
    nuevos:     (MovimientoRaw & { hash: string })[]
    duplicados: number
  }> {
    const conHash = movimientos.map(m => ({ ...m, hash: this.generarHash(m) }))
    const hashes  = conHash.map(m => m.hash)

    const { data } = await supabase
      .from('movimientos_importados')
      .select('hash_dedup')
      .in('hash_dedup', hashes)

    const existentes = new Set((data ?? []).map((r: any) => r.hash_dedup))

    const nuevos     = conHash.filter(m => !existentes.has(m.hash))
    const duplicados = conHash.length - nuevos.length

    return { nuevos, duplicados }
  }
}
```

---

## controllers/gastos.controller.ts

```typescript
import { Request, Response, NextFunction } from 'express'
import { GastosService } from '../services/gastos.service'

const service = new GastosService()

export class GastosController {

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { periodo } = req.query
      const data = await service.getAll(periodo as string | undefined)
      res.json({ data })
    } catch (e) { next(e) }
  }

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.getById(req.params.id)
      if (!data) return res.status(404).json({ error: 'No encontrado' })
      res.json({ data })
    } catch (e) { next(e) }
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.create(req.body)
      res.status(201).json({ data })
    } catch (e) { next(e) }
  }

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.update(req.params.id, req.body)
      res.json({ data })
    } catch (e) { next(e) }
  }

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await service.remove(req.params.id)
      res.status(204).send()
    } catch (e) { next(e) }
  }

  pagarCuota = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.pagarCuota(req.params.id)
      res.json({ data, message: 'Cuota registrada' })
    } catch (e) { next(e) }
  }
}
```

---

## middleware/error.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express'

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(`[${new Date().toISOString()}] ${err.message}`)
  res.status(500).json({ error: err.message })
}
```

## middleware/validate.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export const validateBody = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        error:   'Validación fallida',
        details: result.error.flatten(),
      })
    }
    req.body = result.data
    next()
  }
```

---

## app.ts

```typescript
import express from 'express'
import cors from 'cors'
import router from './routes'
import { errorMiddleware } from './middleware/error.middleware'
import { env } from './config/env'

const app = express()

app.use(cors({ origin: env.FRONTEND_URL }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Prefijo global /api
app.use('/api', router)

// Health check
app.get('/health', (_, res) => res.json({ ok: true }))

// Global error handler — SIEMPRE al final
app.use(errorMiddleware)

app.listen(Number(env.PORT), () => {
  console.log(`🚀 Backend corriendo en puerto ${env.PORT}`)
})

export default app
```

---

## package.json (dependencias clave)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "express": "^4.x",
    "cors": "^2.x",
    "zod": "^3.x",
    "multer": "^1.x",
    "pdf-parse": "^1.x",
    "googleapis": "^140.x",
    "crypto": "built-in"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/express": "^4.x",
    "@types/cors": "^2.x",
    "@types/multer": "^1.x",
    "tsx": "^4.x",
    "nodemon": "^3.x"
  },
  "scripts": {
    "dev":   "nodemon --exec tsx src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  }
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target":          "ES2022",
    "module":          "CommonJS",
    "moduleResolution":"node",
    "outDir":          "./dist",
    "rootDir":         "./src",
    "strict":          true,
    "esModuleInterop": true,
    "resolveJsonModule":true,
    "skipLibCheck":    true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```
