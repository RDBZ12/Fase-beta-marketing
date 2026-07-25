-- 1. Creamos una función que ignora el RLS de 'usuarios' para verificar si es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id_usuario = auth.uid() AND id_rol = 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Borramos la política anterior que estaba fallando por culpa del bloqueo de RLS
DROP POLICY IF EXISTS "Admins pueden ver y editar todas las campañas" ON public.campaigns;
DROP POLICY IF EXISTS "Admins pueden ver todas las campañas" ON public.campaigns;

-- 3. Creamos la nueva política invulnerable
CREATE POLICY "Admins pueden ver todas las campañas" 
ON public.campaigns
FOR ALL
USING ( public.is_admin() );
