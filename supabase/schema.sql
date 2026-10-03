-- Base de datos de la web de boda.
--
-- Cómo usarlo: Supabase > SQL Editor > New query, pega TODO este archivo y
-- pulsa Run. Se puede volver a ejecutar sin romper nada (usa "if not exists"
-- y "create or replace").
--
-- ANTES de ejecutarlo, cambia los dos emails de is_wedding_admin() (más abajo)
-- por los vuestros: son los únicos que podrán entrar al panel. Deben coincidir
-- con la variable ADMIN_EMAILS de Vercel / .env.local.

create extension if not exists pgcrypto;

create or replace function public.normalizar_codigo_invitacion(valor text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(valor, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

create or replace function public.generar_codigo_invitacion()
returns text
language plpgsql
volatile
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  index_count integer;
  i integer;
begin
  loop
    candidate := '';

    -- 8 caracteres: 32^8 combinaciones, código no adivinable por fuerza bruta
    -- (abre datos del invitado, incluidas alergias). Ver invitation-code.ts.
    for i in 1..8 loop
      candidate := candidate || substr(alphabet, (get_byte(gen_random_bytes(1), 0) % length(alphabet)) + 1, 1);
    end loop;

    select count(*)
    into index_count
    from public.invitados
    where public.normalizar_codigo_invitacion(codigo_invitacion) = public.normalizar_codigo_invitacion(candidate);

    exit when index_count = 0;
  end loop;

  return candidate;
end;
$$;

create or replace function public.is_wedding_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'novio1@example.com',
    'novio2@example.com'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.mesas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  capacidad integer not null default 10 check (capacidad > 0),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invitados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellidos text not null,
  email text,
  telefono text,
  grupo text,
  confirmacion_asistencia text not null default 'pendiente'
    check (confirmacion_asistencia in ('pendiente', 'confirmado', 'rechazado')),
  menu_elegido text not null default 'pendiente'
    check (menu_elegido in ('pendiente', 'adulto', 'vegetariano', 'vegano', 'sin_gluten', 'sin_lactosa', 'infantil', 'especial')),
  alergias_intolerancias text,
  necesita_autobus boolean not null default false,
  hotel_alojamiento text,
  mesa_id uuid references public.mesas(id) on delete set null,
  notas_internas text,
  comentarios text,
  rsvp_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  codigo_invitacion text not null default public.generar_codigo_invitacion(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invitados add column if not exists codigo_invitacion text;
alter table public.invitados add column if not exists rsvp_first_view_at timestamptz;
alter table public.invitados add column if not exists rsvp_last_view_at timestamptz;
alter table public.invitados add column if not exists rsvp_view_count integer not null default 0;
alter table public.invitados add column if not exists rsvp_last_locale text;
alter table public.invitados add column if not exists rsvp_first_submitted_at timestamptz;
alter table public.invitados add column if not exists rsvp_last_submitted_at timestamptz;
alter table public.invitados add column if not exists rsvp_submit_count integer not null default 0;
alter table public.invitados add column if not exists cancion_sugerida text;

update public.invitados
set codigo_invitacion = public.generar_codigo_invitacion()
where codigo_invitacion is null or btrim(codigo_invitacion) = '';

alter table public.invitados alter column codigo_invitacion set default public.generar_codigo_invitacion();
alter table public.invitados alter column codigo_invitacion set not null;

create table if not exists public.tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  responsable text not null default 'ambos' check (responsable in ('uno', 'dos', 'ambos')),
  fecha_limite date,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_progreso', 'hecha')),
  prioridad text not null default 'media' check (prioridad in ('baja', 'media', 'alta')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,
  concepto text not null,
  proveedor text,
  coste_estimado numeric(12,2) not null default 0 check (coste_estimado >= 0),
  coste_real numeric(12,2) not null default 0 check (coste_real >= 0),
  estado_pago text not null default 'pendiente' check (estado_pago in ('pendiente', 'parcial', 'pagado')),
  fecha_pago date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.autobuses (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  proveedor text,
  capacidad integer not null default 50 check (capacidad > 0),
  paradas jsonb not null default '[]'::jsonb,
  horarios text,
  estado text not null default 'borrador' check (estado in ('borrador', 'cotizado', 'confirmado')),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.autobus_invitados (
  autobus_id uuid not null references public.autobuses(id) on delete cascade,
  invitado_id uuid not null references public.invitados(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (autobus_id, invitado_id)
);

create table if not exists public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null,
  email text,
  telefono text,
  web text,
  precio numeric(12,2) not null default 0 check (precio >= 0),
  estado text not null default 'idea' check (estado in ('idea', 'contactado', 'cotizado', 'reservado', 'pagado')),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  archivo_nombre text not null,
  tipo text not null default 'documento',
  mime_type text,
  tamano_bytes bigint not null default 0 check (tamano_bytes >= 0),
  storage_path text not null,
  proveedor_id uuid references public.proveedores(id) on delete set null,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.auditoria (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('proveedor', 'documento', 'invitado')),
  entity_id uuid not null,
  action text not null check (action in ('created', 'updated', 'deleted', 'moved')),
  title text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table public.documentos add column if not exists archivo_nombre text;
alter table public.documentos add column if not exists mime_type text;
alter table public.documentos add column if not exists tamano_bytes bigint not null default 0 check (tamano_bytes >= 0);

update public.documentos
set archivo_nombre = coalesce(archivo_nombre, nombre)
where archivo_nombre is null or btrim(archivo_nombre) = '';

alter table public.documentos alter column archivo_nombre set default 'documento';
alter table public.documentos alter column archivo_nombre set not null;

drop trigger if exists set_mesas_updated_at on public.mesas;
create trigger set_mesas_updated_at before update on public.mesas
for each row execute function public.set_updated_at();

drop trigger if exists set_invitados_updated_at on public.invitados;
create trigger set_invitados_updated_at before update on public.invitados
for each row execute function public.set_updated_at();

drop trigger if exists set_tareas_updated_at on public.tareas;
create trigger set_tareas_updated_at before update on public.tareas
for each row execute function public.set_updated_at();

drop trigger if exists set_gastos_updated_at on public.gastos;
create trigger set_gastos_updated_at before update on public.gastos
for each row execute function public.set_updated_at();

drop trigger if exists set_autobuses_updated_at on public.autobuses;
create trigger set_autobuses_updated_at before update on public.autobuses
for each row execute function public.set_updated_at();

drop trigger if exists set_proveedores_updated_at on public.proveedores;
create trigger set_proveedores_updated_at before update on public.proveedores
for each row execute function public.set_updated_at();

drop trigger if exists set_documentos_updated_at on public.documentos;
create trigger set_documentos_updated_at before update on public.documentos
for each row execute function public.set_updated_at();

create table if not exists public.cronograma (
  id uuid primary key default gen_random_uuid(),
  hora text not null,
  titulo text not null,
  descripcion text,
  titulo_ca text,
  descripcion_ca text,
  fijo boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.auditoria enable row level security;
alter table public.mesas enable row level security;
alter table public.invitados enable row level security;
alter table public.tareas enable row level security;
alter table public.gastos enable row level security;
alter table public.autobuses enable row level security;
alter table public.autobus_invitados enable row level security;
alter table public.proveedores enable row level security;
alter table public.documentos enable row level security;
alter table public.cronograma enable row level security;

drop policy if exists "Admins gestionan mesas" on public.mesas;
drop policy if exists "Admins gestionan invitados" on public.invitados;
drop policy if exists "Admins gestionan tareas" on public.tareas;
drop policy if exists "Admins gestionan gastos" on public.gastos;
drop policy if exists "Admins gestionan autobuses" on public.autobuses;
drop policy if exists "Admins gestionan pasajeros de autobus" on public.autobus_invitados;
drop policy if exists "Admins gestionan proveedores" on public.proveedores;
drop policy if exists "Admins gestionan documentos" on public.documentos;
drop policy if exists "Admins gestionan auditoria" on public.auditoria;

create policy "Admins gestionan mesas" on public.mesas
for all to authenticated using (public.is_wedding_admin()) with check (public.is_wedding_admin());

create policy "Admins gestionan invitados" on public.invitados
for all to authenticated using (public.is_wedding_admin()) with check (public.is_wedding_admin());

create policy "Admins gestionan tareas" on public.tareas
for all to authenticated using (public.is_wedding_admin()) with check (public.is_wedding_admin());

create policy "Admins gestionan gastos" on public.gastos
for all to authenticated using (public.is_wedding_admin()) with check (public.is_wedding_admin());

create policy "Admins gestionan autobuses" on public.autobuses
for all to authenticated using (public.is_wedding_admin()) with check (public.is_wedding_admin());

create policy "Admins gestionan pasajeros de autobus" on public.autobus_invitados
for all to authenticated using (public.is_wedding_admin()) with check (public.is_wedding_admin());

create policy "Admins gestionan proveedores" on public.proveedores
for all to authenticated using (public.is_wedding_admin()) with check (public.is_wedding_admin());

create policy "Admins gestionan documentos" on public.documentos
for all to authenticated using (public.is_wedding_admin()) with check (public.is_wedding_admin());

create policy "Admins gestionan auditoria" on public.auditoria
for all to authenticated using (public.is_wedding_admin()) with check (public.is_wedding_admin());

drop policy if exists "Admins gestionan cronograma" on public.cronograma;
create policy "Admins gestionan cronograma" on public.cronograma
for all to authenticated using (public.is_wedding_admin()) with check (public.is_wedding_admin());

create unique index if not exists invitados_codigo_invitacion_idx on public.invitados(codigo_invitacion);
create index if not exists invitados_rsvp_token_idx on public.invitados(rsvp_token);
create index if not exists invitados_mesa_id_idx on public.invitados(mesa_id);
create index if not exists tareas_fecha_limite_idx on public.tareas(fecha_limite);
create index if not exists gastos_categoria_idx on public.gastos(categoria);
create unique index if not exists autobus_invitados_invitado_id_idx on public.autobus_invitados(invitado_id);
create index if not exists proveedores_tipo_idx on public.proveedores(tipo);
create index if not exists proveedores_estado_idx on public.proveedores(estado);
create unique index if not exists documentos_storage_path_idx on public.documentos(storage_path);
create index if not exists documentos_proveedor_id_idx on public.documentos(proveedor_id);
create index if not exists documentos_tipo_idx on public.documentos(tipo);
create index if not exists auditoria_entity_idx on public.auditoria(entity_type, entity_id, created_at desc);

insert into public.mesas (nombre, capacidad)
values ('Mesa 1', 10), ('Mesa 2', 10), ('Mesa 3', 10)
on conflict (nombre) do nothing;

create or replace function public.resumen_dashboard()
returns table (
  total_invitados bigint,
  invitados_confirmados bigint,
  invitados_pendientes bigint,
  presupuesto_previsto numeric,
  presupuesto_gastado numeric,
  tareas_pendientes bigint,
  mesas_asignadas bigint,
  autobuses_asignados bigint,
  proveedores_totales bigint,
  documentos_totales bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_wedding_admin() then
    raise exception 'not allowed';
  end if;

  return query
  select
    (select count(*) from public.invitados),
    (select count(*) from public.invitados where confirmacion_asistencia = 'confirmado'),
    (select count(*) from public.invitados where confirmacion_asistencia = 'pendiente'),
    coalesce((select sum(coste_estimado) from public.gastos), 0),
    coalesce((select sum(coste_real) from public.gastos), 0),
    (select count(*) from public.tareas where estado <> 'hecha'),
    (select count(distinct mesa_id) from public.invitados where mesa_id is not null),
    (select count(distinct autobus_id) from public.autobus_invitados),
    (select count(*) from public.proveedores),
    (select count(*) from public.documentos);
end;
$$;

grant execute on function public.resumen_dashboard() to authenticated;

insert into storage.buckets (id, name, public)
values ('documentos-boda', 'documentos-boda', false)
on conflict (id) do nothing;

drop policy if exists "Admins leen documentos de storage" on storage.objects;
drop policy if exists "Admins suben documentos de storage" on storage.objects;
drop policy if exists "Admins actualizan documentos de storage" on storage.objects;
drop policy if exists "Admins borran documentos de storage" on storage.objects;

create policy "Admins leen documentos de storage" on storage.objects
for select to authenticated
using (bucket_id = 'documentos-boda' and public.is_wedding_admin());

create policy "Admins suben documentos de storage" on storage.objects
for insert to authenticated
with check (bucket_id = 'documentos-boda' and public.is_wedding_admin());

create policy "Admins actualizan documentos de storage" on storage.objects
for update to authenticated
using (bucket_id = 'documentos-boda' and public.is_wedding_admin())
with check (bucket_id = 'documentos-boda' and public.is_wedding_admin());

create policy "Admins borran documentos de storage" on storage.objects
for delete to authenticated
using (bucket_id = 'documentos-boda' and public.is_wedding_admin());


-- ═════════════════════════════════════════════════════════════════════
-- Canción sugerida en el RSVP
-- ═════════════════════════════════════════════════════════════════════

-- Columna para la canción que sugiere cada invitado en el RSVP.

alter table public.invitados add column if not exists cancion_sugerida text;

-- ═════════════════════════════════════════════════════════════════════
-- Cronograma bilingüe
-- ═════════════════════════════════════════════════════════════════════

-- Cronograma bilingüe: variante en catalán de título y descripción.
-- Sin estas columnas, los eventos personalizados del cronograma se mostraban
-- en la vista pública /agenda en un solo idioma, ignorando el locale del invitado.

alter table public.cronograma add column if not exists titulo_ca text;
alter table public.cronograma add column if not exists descripcion_ca text;


-- ═════════════════════════════════════════════════════════════════════
-- Métricas del panel
-- ═════════════════════════════════════════════════════════════════════

-- Métricas del panel calculadas en la base de datos.
--
-- Antes, el dashboard se descargaba la lista completa de invitados, de catering,
-- de mesas, de autobuses y de pasajeros SOLO para contar en JavaScript, además
-- de llamar a resumen_dashboard(). Con 30 invitados no se nota; con 150 y desde
-- el móvil, sí — y la lógica quedaba duplicada en dos sitios.
--
-- Esta función devuelve todo lo que el panel necesita contar, en una consulta.

create or replace function public.metricas_dashboard()
returns table (
  total_invitados bigint,
  invitados_confirmados bigint,
  invitados_pendientes bigint,
  invitados_rechazados bigint,
  presupuesto_previsto numeric,
  presupuesto_gastado numeric,
  tareas_pendientes bigint,
  mesas_asignadas bigint,
  autobuses_asignados bigint,
  proveedores_totales bigint,
  documentos_totales bigint,
  plazas_mesas bigint,
  invitados_con_mesa bigint,
  plazas_bus bigint,
  pasajeros_bus bigint,
  invitados_vieron_rsvp bigint,
  invitados_respondieron_rsvp bigint,
  catering_total bigint,
  catering_con_alergias bigint,
  menus jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_wedding_admin() then
    raise exception 'not allowed';
  end if;

  return query
  select
    (select count(*) from public.invitados),
    (select count(*) from public.invitados where confirmacion_asistencia = 'confirmado'),
    (select count(*) from public.invitados where confirmacion_asistencia = 'pendiente'),
    (select count(*) from public.invitados where confirmacion_asistencia = 'rechazado'),
    coalesce((select sum(coste_estimado) from public.gastos), 0),
    coalesce((select sum(coste_real) from public.gastos), 0),
    (select count(*) from public.tareas where estado <> 'hecha'),
    (select count(distinct mesa_id) from public.invitados where mesa_id is not null),
    (select count(distinct autobus_id) from public.autobus_invitados),
    (select count(*) from public.proveedores),
    (select count(*) from public.documentos),
    coalesce((select sum(capacidad) from public.mesas), 0)::bigint,
    (select count(*) from public.invitados where mesa_id is not null),
    coalesce((select sum(capacidad) from public.autobuses), 0)::bigint,
    (select count(*) from public.autobus_invitados),
    (select count(*) from public.invitados where rsvp_view_count > 0),
    (select count(*) from public.invitados where rsvp_submit_count > 0),
    (select count(*) from public.invitados where confirmacion_asistencia = 'confirmado'),
    (select count(*) from public.invitados
      where confirmacion_asistencia = 'confirmado'
        and alergias_intolerancias is not null
        and btrim(alergias_intolerancias) <> ''),
    coalesce((
      select jsonb_object_agg(menu_elegido, total)
      from (
        select menu_elegido, count(*) as total
        from public.invitados
        where confirmacion_asistencia = 'confirmado'
        group by menu_elegido
      ) as conteo
    ), '{}'::jsonb);
end;
$$;

grant execute on function public.metricas_dashboard() to authenticated;


-- ═════════════════════════════════════════════════════════════════════
-- Papelera de invitados
-- ═════════════════════════════════════════════════════════════════════

-- Papelera de invitados: borrar deja de ser definitivo.
--
-- El panel se usa a menudo desde el móvil y con prisa, entre dos personas, y
-- los datos no tienen copia automática. Un borrado por error era irreversible.
-- Ahora se marca la fecha de borrado y el invitado desaparece de los listados,
-- pero se puede recuperar durante 30 días.

alter table public.invitados add column if not exists eliminado_en timestamptz;

create index if not exists invitados_eliminado_en_idx
  on public.invitados(eliminado_en)
  where eliminado_en is not null;

-- Y las métricas del panel tampoco cuentan a los eliminados.
create or replace function public.metricas_dashboard()
returns table (
  total_invitados bigint,
  invitados_confirmados bigint,
  invitados_pendientes bigint,
  invitados_rechazados bigint,
  presupuesto_previsto numeric,
  presupuesto_gastado numeric,
  tareas_pendientes bigint,
  mesas_asignadas bigint,
  autobuses_asignados bigint,
  proveedores_totales bigint,
  documentos_totales bigint,
  plazas_mesas bigint,
  invitados_con_mesa bigint,
  plazas_bus bigint,
  pasajeros_bus bigint,
  invitados_vieron_rsvp bigint,
  invitados_respondieron_rsvp bigint,
  catering_total bigint,
  catering_con_alergias bigint,
  menus jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_wedding_admin() then
    raise exception 'not allowed';
  end if;

  return query
  select
    (select count(*) from public.invitados where eliminado_en is null),
    (select count(*) from public.invitados where eliminado_en is null and confirmacion_asistencia = 'confirmado'),
    (select count(*) from public.invitados where eliminado_en is null and confirmacion_asistencia = 'pendiente'),
    (select count(*) from public.invitados where eliminado_en is null and confirmacion_asistencia = 'rechazado'),
    coalesce((select sum(coste_estimado) from public.gastos), 0),
    coalesce((select sum(coste_real) from public.gastos), 0),
    (select count(*) from public.tareas where estado <> 'hecha'),
    (select count(distinct mesa_id) from public.invitados where eliminado_en is null and mesa_id is not null),
    (select count(distinct autobus_id) from public.autobus_invitados),
    (select count(*) from public.proveedores),
    (select count(*) from public.documentos),
    coalesce((select sum(capacidad) from public.mesas), 0)::bigint,
    (select count(*) from public.invitados where eliminado_en is null and mesa_id is not null),
    coalesce((select sum(capacidad) from public.autobuses), 0)::bigint,
    (select count(*) from public.autobus_invitados),
    (select count(*) from public.invitados where eliminado_en is null and rsvp_view_count > 0),
    (select count(*) from public.invitados where eliminado_en is null and rsvp_submit_count > 0),
    (select count(*) from public.invitados where eliminado_en is null and confirmacion_asistencia = 'confirmado'),
    (select count(*) from public.invitados
      where eliminado_en is null
        and confirmacion_asistencia = 'confirmado'
        and alergias_intolerancias is not null
        and btrim(alergias_intolerancias) <> ''),
    coalesce((
      select jsonb_object_agg(menu_elegido, total)
      from (
        select menu_elegido, count(*) as total
        from public.invitados
        where eliminado_en is null and confirmacion_asistencia = 'confirmado'
        group by menu_elegido
      ) as conteo
    ), '{}'::jsonb);
end;
$$;

grant execute on function public.metricas_dashboard() to authenticated;


-- ═════════════════════════════════════════════════════════════════════
-- Funciones públicas del RSVP
-- ═════════════════════════════════════════════════════════════════════

-- Son las únicas puertas de la web de invitados a la base de datos (rol anon,
-- con la clave pública que viaja en el navegador). Cada una exige el enlace o
-- el código de UN invitado y solo lee o cambia lo de ese invitado. Los
-- invitados en la papelera (eliminado_en) no existen para ellas.
--
-- Van al final del archivo porque usan columnas añadidas más arriba.

-- Restos de versiones anteriores: se borran por si este SQL se ejecuta sobre
-- una base antigua. Exponían a cualquiera la lista completa de invitados.
drop function if exists public.muro_publico();
drop function if exists public.popularidad_menus();
drop function if exists public.actualizar_rsvp_invitado(text, text, text, text, boolean, text, text);
drop function if exists public.actualizar_rsvp_invitado(text, text, text, text, boolean, text, text, text);
-- Cambia de columnas: hay que borrarla antes de volver a crearla.
drop function if exists public.obtener_rsvp_invitado(text);

-- Compara apellidos ignorando mayúsculas, acentos y espacios de más
-- (igual que la web, que normaliza antes de enviar).
create or replace function public.normalizar_apellido(valor text)
returns text
language sql
immutable
as $$
  select btrim(regexp_replace(
    translate(lower(coalesce(valor, '')), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'),
    '\s+', ' ', 'g'
  ));
$$;

-- Lo que ve el invitado en su página. No devuelve el apellido: es la
-- respuesta a la comprobación para cambiar una respuesta ya enviada.
create or replace function public.obtener_rsvp_invitado(token_param text)
returns table (
  nombre text,
  confirmacion_asistencia text,
  menu_elegido text,
  alergias_intolerancias text,
  necesita_autobus boolean,
  hotel_alojamiento text,
  comentarios text,
  cancion_sugerida text,
  rsvp_last_submitted_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    i.nombre,
    i.confirmacion_asistencia,
    i.menu_elegido,
    i.alergias_intolerancias,
    i.necesita_autobus,
    i.hotel_alojamiento,
    i.comentarios,
    i.cancion_sugerida,
    i.rsvp_last_submitted_at
  from public.invitados i
  where i.eliminado_en is null
    and (
      i.rsvp_token = token_param
      or public.normalizar_codigo_invitacion(i.codigo_invitacion) = public.normalizar_codigo_invitacion(token_param)
    )
  limit 1;
$$;

grant execute on function public.obtener_rsvp_invitado(text) to anon, authenticated;

-- ¿Este apellido es el del invitado de este enlace? Solo responde sí o no.
create or replace function public.comprobar_apellido_invitado(token_param text, apellido_param text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.invitados i
    where i.eliminado_en is null
      and (
        i.rsvp_token = token_param
        or public.normalizar_codigo_invitacion(i.codigo_invitacion) = public.normalizar_codigo_invitacion(token_param)
      )
      and public.normalizar_apellido(apellido_param) <> ''
      and public.normalizar_apellido(i.apellidos) = public.normalizar_apellido(apellido_param)
  );
$$;

grant execute on function public.comprobar_apellido_invitado(text, text) to anon, authenticated;

-- Cuenta las visitas al enlace personal (para el panel).
create or replace function public.registrar_acceso_rsvp(token_param text, locale_param text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.invitados
  set
    rsvp_view_count = coalesce(rsvp_view_count, 0) + 1,
    rsvp_first_view_at = coalesce(rsvp_first_view_at, now()),
    rsvp_last_view_at = now(),
    rsvp_last_locale = coalesce(locale_param, rsvp_last_locale),
    updated_at = now()
  where eliminado_en is null
    and (
      rsvp_token = token_param
      or public.normalizar_codigo_invitacion(codigo_invitacion) = public.normalizar_codigo_invitacion(token_param)
    );

  if not found then
    raise exception 'token no encontrado';
  end if;
end;
$$;

grant execute on function public.registrar_acceso_rsvp(text, text) to anon, authenticated;

-- Guarda la respuesta. La primera vez basta con el enlace; para CAMBIAR una
-- respuesta ya enviada hace falta además el apellido, para que un enlace
-- reenviado por error no permita cambiar los datos de otra persona.
create or replace function public.actualizar_rsvp_invitado(
  token_param text,
  asistencia_param text,
  menu_param text,
  alergias_param text,
  autobus_param boolean,
  hotel_param text,
  comentarios_param text,
  cancion_param text,
  apellido_param text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invitado record;
begin
  if asistencia_param not in ('confirmado', 'rechazado') then
    raise exception 'asistencia invalida';
  end if;

  if menu_param not in ('adulto', 'vegetariano', 'vegano', 'sin_gluten', 'sin_lactosa', 'infantil', 'especial') then
    raise exception 'menu invalido';
  end if;

  select i.id, i.apellidos, i.confirmacion_asistencia
  into invitado
  from public.invitados i
  where i.eliminado_en is null
    and (
      i.rsvp_token = token_param
      or public.normalizar_codigo_invitacion(i.codigo_invitacion) = public.normalizar_codigo_invitacion(token_param)
    )
  limit 1;

  if invitado.id is null then
    raise exception 'token no encontrado';
  end if;

  if invitado.confirmacion_asistencia <> 'pendiente'
    and (
      public.normalizar_apellido(apellido_param) = ''
      or public.normalizar_apellido(apellido_param) <> public.normalizar_apellido(invitado.apellidos)
    ) then
    raise exception 'apellido requerido';
  end if;

  update public.invitados
  set
    confirmacion_asistencia = asistencia_param,
    menu_elegido = menu_param,
    alergias_intolerancias = alergias_param,
    necesita_autobus = autobus_param,
    hotel_alojamiento = hotel_param,
    comentarios = comentarios_param,
    cancion_sugerida = cancion_param,
    rsvp_submit_count = coalesce(rsvp_submit_count, 0) + 1,
    rsvp_first_submitted_at = coalesce(rsvp_first_submitted_at, now()),
    rsvp_last_submitted_at = now(),
    updated_at = now()
  where id = invitado.id;
end;
$$;

grant execute on function public.actualizar_rsvp_invitado(text, text, text, text, boolean, text, text, text, text) to anon, authenticated;

-- Mesa y autobús asignados al invitado, para enseñárselos en su página.
-- Solo los nombres: nada de las demás personas de la mesa.
create or replace function public.obtener_rsvp_extras(token_param text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  self_rec record;
  bus_rec record;
begin
  select i.id, m.nombre as mesa_nombre
  into self_rec
  from public.invitados i
  left join public.mesas m on m.id = i.mesa_id
  where i.eliminado_en is null
    and (
      i.rsvp_token = token_param
      or public.normalizar_codigo_invitacion(i.codigo_invitacion) = public.normalizar_codigo_invitacion(token_param)
    )
  limit 1;

  if self_rec.id is null then
    return null;
  end if;

  select a.nombre, a.horarios
  into bus_rec
  from public.autobus_invitados ai
  join public.autobuses a on a.id = ai.autobus_id
  where ai.invitado_id = self_rec.id
  limit 1;

  return jsonb_build_object(
    'mesa_nombre', self_rec.mesa_nombre,
    'bus_nombre', bus_rec.nombre,
    'bus_horarios', bus_rec.horarios
  );
end;
$$;

grant execute on function public.obtener_rsvp_extras(text) to anon, authenticated;
