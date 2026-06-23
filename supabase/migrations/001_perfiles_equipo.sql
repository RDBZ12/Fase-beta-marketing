create table perfiles_equipo (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  apellido text,
  rol text not null check (rol in ('administrador','gerencia','marketing','community_manager','servicio_cliente')),
  estado text default 'activo' check (estado in ('activo','inactivo')),
  created_at timestamptz default now()
);

alter table perfiles_equipo enable row level security;

create policy "Usuario ve su propio perfil"
  on perfiles_equipo for select
  using (auth.uid() = id);

create policy "Administradores ven todos"
  on perfiles_equipo for select
  using (
    exists (
      select 1 from perfiles_equipo p
      where p.id = auth.uid() and p.rol = 'administrador'
    )
  );

create policy "Administradores insertan"
  on perfiles_equipo for insert
  with check (
    exists (
      select 1 from perfiles_equipo p
      where p.id = auth.uid() and p.rol = 'administrador'
    )
  );

create policy "Administradores actualizan"
  on perfiles_equipo for update
  using (
    exists (
      select 1 from perfiles_equipo p
      where p.id = auth.uid() and p.rol = 'administrador'
    )
  );
