-- Fix SELECT policy for campaigns and add SELECT policies for users tables so App.tsx can join
DROP POLICY IF EXISTS "campaigns_select_usuario" ON public.campaigns;
CREATE POLICY "campaigns_select_usuario" ON public.campaigns FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "usuarios_select_all" ON public.usuarios;
CREATE POLICY "usuarios_select_all" ON public.usuarios FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "clientes_portal_select_all" ON public.clientes_portal;
CREATE POLICY "clientes_portal_select_all" ON public.clientes_portal FOR SELECT TO authenticated USING (true);
