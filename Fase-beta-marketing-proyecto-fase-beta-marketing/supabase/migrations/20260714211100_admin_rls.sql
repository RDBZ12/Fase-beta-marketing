-- Si el administrador no puede ver las campañas en el panel, es porque
-- el sistema RLS (Row Level Security) de Supabase lo está bloqueando.
-- Ejecuta este comando en el SQL Editor de Supabase para darle permiso al admin:

CREATE POLICY "Admins pueden ver y editar todas las campañas" 
ON public.campaigns
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id_usuario = auth.uid() AND usuarios.id_rol = 1
  )
);

-- Nota: Si el administrador tiene un id_rol diferente a 1 en tu sistema, ajusta el número.
