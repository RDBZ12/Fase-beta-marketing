-- Relax foreign key constraints on campaigns so both clientes_portal and usuarios can insert their auth user ID

ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_id_usuario_fkey;
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_id_cliente_fkey;

-- Now, id_usuario and id_cliente can hold any UUID, usually the auth.uid() of the creator.
