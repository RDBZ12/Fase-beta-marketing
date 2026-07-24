create table pagos (
  id uuid primary key default gen_random_uuid(),
  id_campana text not null,
  nombre_campana text,
  monto numeric(10,2) not null,
  itbis numeric(10,2),
  total numeric(10,2),
  ncf text unique,
  rnc_cliente text,
  razon_social_cliente text,
  estado_pago text default 'pendiente',
  metodo_pago text default 'PayPal',
  paypal_order_id text,
  fecha timestamptz default now(),
  created_by uuid references auth.users(id)
);

alter table pagos enable row level security;

create policy "Solo equipo interno gestiona pagos"
  on pagos for all
  using (
    exists (
      select 1 from perfiles_equipo p
      where p.id = auth.uid()
    )
  );
