# Frontend — Angular 18 + TypeScript

## Estructura de carpetas

```
frontend/
└── src/
    └── app/
        ├── core/
        │   ├── models/
        │   │   ├── gasto.model.ts
        │   │   ├── ingreso.model.ts
        │   │   ├── tarjeta.model.ts
        │   │   ├── periodo.model.ts
        │   │   ├── deuda.model.ts
        │   │   └── resumen.model.ts
        │   │
        │   ├── services/
        │   │   ├── gastos.service.ts
        │   │   ├── ingresos.service.ts
        │   │   ├── tarjetas.service.ts
        │   │   ├── periodos.service.ts
        │   │   ├── resumen.service.ts
        │   │   └── importaciones.service.ts
        │   │
        │   └── interceptors/
        │       └── api.interceptor.ts   # Base URL + headers
        │
        ├── shared/
        │   ├── components/
        │   │   ├── currency-display/    # Formatea ARS/USD
        │   │   ├── progress-bar/        # Barra de avance cuotas
        │   │   ├── periodo-selector/    # ← Mayo 2025 →
        │   │   └── confirm-dialog/      # Modal genérico
        │   └── pipes/
        │       └── ars-currency.pipe.ts
        │
        ├── features/
        │   ├── dashboard/
        │   │   ├── dashboard.component.ts   # Layout principal
        │   │   └── kpi-sidebar/             # Panel de KPIs lateral
        │   │
        │   ├── gastos/
        │   │   ├── gastos.component.ts      # Contenedor de feature
        │   │   ├── gastos-table/            # Tabla principal
        │   │   └── gasto-form/              # Modal alta/edición
        │   │
        │   ├── ingresos/
        │   │   └── ingresos.component.ts
        │   │
        │   ├── importaciones/
        │   │   └── importaciones.component.ts  # Upload PDF + revisión
        │   │
        │   └── deudas/
        │       └── deudas.component.ts
        │
        ├── app.routes.ts
        ├── app.config.ts
        └── app.component.ts
```

---

## app.config.ts

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { routes } from './app.routes'
import { apiInterceptor } from './core/interceptors/api.interceptor'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiInterceptor])),
  ]
}
```

## app.routes.ts

```typescript
import { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  },
  {
    path: 'gastos',
    loadComponent: () =>
      import('./features/gastos/gastos.component')
        .then(m => m.GastosComponent)
  },
  {
    path: 'ingresos',
    loadComponent: () =>
      import('./features/ingresos/ingresos.component')
        .then(m => m.IngresosComponent)
  },
  {
    path: 'importaciones',
    loadComponent: () =>
      import('./features/importaciones/importaciones.component')
        .then(m => m.ImportacionesComponent)
  },
  {
    path: 'deudas',
    loadComponent: () =>
      import('./features/deudas/deudas.component')
        .then(m => m.DeudasComponent)
  },
]
```

---

## core/interceptors/api.interceptor.ts

```typescript
import { HttpInterceptorFn } from '@angular/common/http'
import { environment } from '../../../environments/environment'

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const apiReq = req.clone({
    url: `${environment.apiUrl}${req.url}`,
    setHeaders: {
      'Content-Type': 'application/json',
    }
  })
  return next(apiReq)
}
```

## environments/environment.ts

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
}
```

---

## core/models/gasto.model.ts

```typescript
export type TipoGasto = 'Fijo' | 'Cuotas'

export interface Gasto {
  id:                 string
  nombre:             string
  tipo:               TipoGasto
  cuotasTotal:        number | null
  cuotasPagadas:      number
  montoARS:           number
  montoUSD:           number
  tarjetaId:          string | null
  fechaInicio:        string
  activo:             boolean
  // VOs calculados (vienen del backend)
  cuotasRestantes:    number
  montoTotalRestante: number
  totalAPagar:        number
  avancePorcentaje:   number
}

export interface CreateGastoDto {
  nombre:        string
  tipo:          TipoGasto
  cuotasTotal?:  number
  cuotasPagadas: number
  montoARS:      number
  montoUSD?:     number
  tarjetaId?:    string
  fechaInicio:   string
}
```

## core/models/resumen.model.ts

```typescript
export interface ResumenMensual {
  valorUSD:             number
  totalMensualARS:      number
  totalMensualUSD:      number
  totalMesARS:          number
  sinDeudasARS:         number
  cierreTotalARS:       number
  tarjetasMensualARS:   number
  noTarjetasMensualARS: number
  totalIngresosARS:     number
  totalIngresosUSD:     number
  tarjetas: {
    id:        string
    nombre:    string
    limiteUSD: number
    usadoUSD:  number
    diaCierre: number
  }[]
  deudasExtras: {
    descripcion: string
    monto:       number
    moneda:      'ARS' | 'USD'
  }[]
}
```

---

## core/services/gastos.service.ts

```typescript
import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, map } from 'rxjs'
import { Gasto, CreateGastoDto } from '../models/gasto.model'

@Injectable({ providedIn: 'root' })
export class GastosService {
  private http = inject(HttpClient)

  getAll(periodo?: string): Observable<Gasto[]> {
    const params = periodo ? { periodo } : {}
    return this.http
      .get<{ data: Gasto[] }>('/gastos', { params })
      .pipe(map(r => r.data))
  }

  create(dto: CreateGastoDto): Observable<Gasto> {
    return this.http
      .post<{ data: Gasto }>('/gastos', dto)
      .pipe(map(r => r.data))
  }

  update(id: string, dto: Partial<CreateGastoDto>): Observable<Gasto> {
    return this.http
      .patch<{ data: Gasto }>(`/gastos/${id}`, dto)
      .pipe(map(r => r.data))
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/gastos/${id}`)
  }

  pagarCuota(id: string): Observable<Gasto> {
    return this.http
      .post<{ data: Gasto }>(`/gastos/${id}/pagar-cuota`, {})
      .pipe(map(r => r.data))
  }
}
```

## core/services/resumen.service.ts

```typescript
import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, map } from 'rxjs'
import { ResumenMensual } from '../models/resumen.model'

@Injectable({ providedIn: 'root' })
export class ResumenService {
  private http = inject(HttpClient)

  getResumen(anio: number, mes: number): Observable<ResumenMensual> {
    return this.http
      .get<{ data: ResumenMensual }>(`/periodos/${anio}/${mes}/resumen`)
      .pipe(map(r => r.data))
  }
}
```

---

## features/gastos/gastos.component.ts

```typescript
import { Component, OnInit, inject, signal, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { GastosService } from '../../core/services/gastos.service'
import { Gasto } from '../../core/models/gasto.model'
import { GastosTableComponent } from './gastos-table/gastos-table.component'
import { GastoFormComponent } from './gasto-form/gasto-form.component'
import { PeriodoSelectorComponent } from '../../shared/components/periodo-selector/periodo-selector.component'

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, GastosTableComponent, GastoFormComponent, PeriodoSelectorComponent],
  template: `
    <div class="gastos-page">
      <header class="page-header">
        <app-periodo-selector
          [anio]="anioActual()"
          [mes]="mesActual()"
          (cambio)="onPeriodoCambio($event)" />

        <div class="header-actions">
          <button class="btn-outline" (click)="abrirForm()">+ Agregar Gasto</button>
          <button class="btn-icon" title="Exportar">↓</button>
        </div>
      </header>

      <app-gastos-table
        [gastos]="gastos()"
        [loading]="loading()"
        (editar)="abrirForm($event)"
        (eliminar)="onEliminar($event)"
        (pagarCuota)="onPagarCuota($event)" />

      @if (formAbierto()) {
        <app-gasto-form
          [gasto]="gastoEditando()"
          (guardar)="onGuardar($event)"
          (cerrar)="cerrarForm()" />
      }
    </div>
  `
})
export class GastosComponent implements OnInit {
  private svc = inject(GastosService)

  // Signals — estado reactivo
  gastos       = signal<Gasto[]>([])
  loading      = signal(false)
  formAbierto  = signal(false)
  gastoEditando= signal<Gasto | null>(null)
  anioActual   = signal(new Date().getFullYear())
  mesActual    = signal(new Date().getMonth() + 1)

  ngOnInit() { this.cargar() }

  cargar() {
    this.loading.set(true)
    const periodo = `${this.anioActual()}-${String(this.mesActual()).padStart(2,'0')}`
    this.svc.getAll(periodo).subscribe({
      next: data => { this.gastos.set(data); this.loading.set(false) },
      error: ()  => { this.loading.set(false) }
    })
  }

  abrirForm(gasto?: Gasto) {
    this.gastoEditando.set(gasto ?? null)
    this.formAbierto.set(true)
  }

  cerrarForm() {
    this.formAbierto.set(false)
    this.gastoEditando.set(null)
  }

  onGuardar(dto: any) {
    const obs = this.gastoEditando()
      ? this.svc.update(this.gastoEditando()!.id, dto)
      : this.svc.create(dto)

    obs.subscribe(() => { this.cerrarForm(); this.cargar() })
  }

  onEliminar(id: string) {
    this.svc.delete(id).subscribe(() => this.cargar())
  }

  onPagarCuota(id: string) {
    this.svc.pagarCuota(id).subscribe(() => this.cargar())
  }

  onPeriodoCambio(e: { anio: number; mes: number }) {
    this.anioActual.set(e.anio)
    this.mesActual.set(e.mes)
    this.cargar()
  }
}
```

---

## shared/pipes/ars-currency.pipe.ts

```typescript
import { Pipe, PipeTransform } from '@angular/core'

@Pipe({ name: 'arsCurrency', standalone: true })
export class ArsCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, moneda: 'ARS' | 'USD' = 'ARS'): string {
    if (value == null) return '-'
    const opts: Intl.NumberFormatOptions = {
      style:                 'currency',
      currency:              moneda === 'ARS' ? 'ARS' : 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
    return new Intl.NumberFormat('es-AR', opts).format(value)
  }
}
```
