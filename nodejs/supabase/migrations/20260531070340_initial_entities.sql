-- ────────────────────────────────────────────────────────────
-- gastos
-- ────────────────────────────────────────────────────────────
create table if not exists public.gastos (
    id              uuid        primary key default gen_random_uuid(),
    created_at      timestamptz not null    default now(),
    updated_at      timestamptz not null    default now(),
    nombre          varchar     not null,
    tipo            text        not null,            -- 'fijo' | 'cuotas'
    cuotas_total    bigint,
    cuotas_pagadas  bigint      not null    default 0,
    monto_ars       numeric     not null    default 0,
    monto_usd       numeric,
    fecha_inicio    timestamptz,
    activo          boolean     not null    default true,
    tarjeta_id      uuid                              -- NULL = gasto sin tarjeta (efectivo/débito/transf.); FK más abajo
);

-- ────────────────────────────────────────────────────────────
-- ingresos
-- ────────────────────────────────────────────────────────────
create table if not exists public.ingresos (
    id              uuid        primary key default gen_random_uuid(),
    created_at      timestamptz not null    default now(),
    updated_at      timestamptz not null    default now(),
    descripcion     varchar,
    monto_ars       numeric     not null    default 0,
    monto_usd       numeric,
    moneda          text,                            -- 'ARS' | 'USD'
    periodo         timestamptz,                     -- fecha que representa el mes
    tipo_cambio     numeric                          -- valor del USD en ese momento
);

-- ────────────────────────────────────────────────────────────
-- periodos_mensuales
-- ────────────────────────────────────────────────────────────
create table if not exists public.periodos_mensuales (
    id              uuid        primary key default gen_random_uuid(),
    created_at      timestamptz not null    default now(),
    updated_at      timestamptz not null    default now(),
    anio            smallint    not null,
    mes             smallint    not null,
    tipo_cambio     numeric,
    cerrado_en      timestamptz,
    activo          boolean     not null    default true,
    constraint uq_periodos_anio_mes unique (anio, mes)
);

-- ────────────────────────────────────────────────────────────
-- deudas_extra
-- ────────────────────────────────────────────────────────────
create table if not exists public.deudas_extra (
    id              uuid        primary key default gen_random_uuid(),
    created_at      timestamptz not null    default now(),
    updated_at      timestamptz not null    default now(),
    descripcion     varchar,
    monto           numeric     not null    default 0,
    moneda          text,                            -- 'ARS' | 'USD'
    observaciones   varchar,
    estado          text        not null    default 'activa'  -- 'activa' | 'saldada'
);

-- ────────────────────────────────────────────────────────────
-- tarjetas  (un gasto referencia su tarjeta vía gastos.tarjeta_id)
-- ────────────────────────────────────────────────────────────
create table if not exists public.tarjetas (
    id                  uuid        primary key default gen_random_uuid(),
    created_at          timestamptz not null    default now(),
    updated_at          timestamptz not null    default now(),
    nombre              varchar,                     -- 'NaranjaX' | 'BBVA' | 'Mercado Pago' ...
    limite_usd          numeric,
    fecha_cierre        timestamptz,
    fecha_vencimiento   timestamptz
);

-- FK de gastos.tarjeta_id -> tarjetas(id) (se agrega acá porque tarjetas ya existe)
alter table public.gastos
    drop constraint if exists fk_gastos_tarjeta,
    add  constraint fk_gastos_tarjeta foreign key (tarjeta_id)
         references public.tarjetas(id) on delete set null;

-- ────────────────────────────────────────────────────────────
-- movimientos_importados  (referencia a gastos vía gasto_id)
-- ────────────────────────────────────────────────────────────
create table if not exists public.movimientos_importados (
    id                  uuid        primary key default gen_random_uuid(),
    created_at          timestamptz not null    default now(),
    updated_at          timestamptz not null    default now(),
    origen              text,                            -- 'NaranjaX' | 'BBVA' | 'Mercado Pago' | 'Manual'
    fecha               timestamptz,
    descripcion         varchar,
    monto_ars           numeric     not null    default 0,
    cuota_actual        smallint,
    cuotas_total        smallint,
    estado_revision     text        not null    default 'pendiente',  -- 'pendiente' | 'confirmado' | 'descartado'
    gasto_id            uuid        references public.gastos(id) on delete set null,
    importado_en        timestamptz not null    default now(),
    archivo_origen      varchar
);

-- ────────────────────────────────────────────────────────────
-- Índices para las queries más comunes del backend
-- ────────────────────────────────────────────────────────────
create index if not exists ix_gastos_activo
    on public.gastos (activo) where activo = true;

create index if not exists ix_ingresos_periodo
    on public.ingresos (periodo);

create index if not exists ix_gastos_tarjeta
    on public.gastos (tarjeta_id) where tarjeta_id is not null;

create index if not exists ix_movimientos_pendientes
    on public.movimientos_importados (estado_revision) where estado_revision = 'pendiente';

create index if not exists ix_movimientos_gasto
    on public.movimientos_importados (gasto_id) where gasto_id is not null;
