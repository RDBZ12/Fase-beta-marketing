-- =============================================================================
-- MIGRACIÓN 002: Row Level Security (RLS) — Políticas por rol
-- Proyecto Integrador UTESA — Marketdev
-- Fecha: 2026-06-20
-- EJECUTAR DESPUÉS de 001_initial_schema.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCIÓN HELPER: obtener el rol del usuario autenticado actual
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_rol()
RETURNS INTEGER AS $$
  SELECT id_rol FROM public.usuarios WHERE id_usuario = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id_usuario = auth.uid() AND id_rol = 1
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_gerencia_or_above()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id_usuario = auth.uid() AND id_rol <= 2
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_marketing_or_above()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id_usuario = auth.uid() AND id_rol <= 3
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_community_or_above()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id_usuario = auth.uid() AND id_rol <= 4
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: roles — solo lectura para todos los autenticados
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_select_all_authenticated"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "roles_manage_admin_only"
  ON public.roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: usuarios
--   - Admins: CRUD completo
--   - Gerencia/Marketing/CM/Cliente: solo leer su propio perfil + otros usuarios
--   - Cada usuario puede actualizar su propio perfil
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_select_authenticated"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "usuarios_insert_admin"
  ON public.usuarios FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "usuarios_update_own_or_admin"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (id_usuario = auth.uid() OR public.is_admin())
  WITH CHECK (id_usuario = auth.uid() OR public.is_admin());

CREATE POLICY "usuarios_delete_admin"
  ON public.usuarios FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: clientes
--   - Nivel 1 (Admin): CRUD completo
--   - Nivel 2 (Gerencia): solo leer
--   - Nivel 3 (Marketing): leer + crear + editar
--   - Nivel 4 (Community Manager): solo leer
--   - Nivel 5 (Servicio al Cliente): solo leer
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_select_all_authenticated"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "clientes_insert_marketing_above"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_marketing_or_above());

CREATE POLICY "clientes_update_marketing_above"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (public.is_marketing_or_above())
  WITH CHECK (public.is_marketing_or_above());

CREATE POLICY "clientes_delete_admin"
  ON public.clientes FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: campaigns
--   - Admin: CRUD completo
--   - Gerencia: leer + aprobar (actualizar estado)
--   - Marketing: crear + editar + leer
--   - Community Manager: solo leer
--   - Servicio al Cliente: solo leer
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select_all_authenticated"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "campaigns_insert_marketing_above"
  ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (public.is_marketing_or_above());

CREATE POLICY "campaigns_update_gerencia_above"
  ON public.campaigns FOR UPDATE
  TO authenticated
  USING (public.is_gerencia_or_above())
  WITH CHECK (public.is_gerencia_or_above());

CREATE POLICY "campaigns_delete_admin"
  ON public.campaigns FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: redes_sociales
--   - Todos autenticados: leer
--   - Admin y Community Manager: gestionar
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.redes_sociales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "redes_select_all"
  ON public.redes_sociales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "redes_manage_community_above"
  ON public.redes_sociales FOR ALL
  TO authenticated
  USING (public.is_community_or_above())
  WITH CHECK (public.is_community_or_above());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: tipos_contenido
--   - Todos autenticados: leer
--   - Admin: gestionar
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.tipos_contenido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tipos_contenido_select_all"
  ON public.tipos_contenido FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tipos_contenido_manage_admin"
  ON public.tipos_contenido FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: publicaciones
--   - Admin + Marketing + Community Manager: CRUD
--   - Gerencia + Servicio al Cliente: solo leer
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.publicaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publicaciones_select_all"
  ON public.publicaciones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "publicaciones_insert_community_above"
  ON public.publicaciones FOR INSERT
  TO authenticated
  WITH CHECK (public.is_community_or_above());

CREATE POLICY "publicaciones_update_community_above"
  ON public.publicaciones FOR UPDATE
  TO authenticated
  USING (public.is_community_or_above())
  WITH CHECK (public.is_community_or_above());

CREATE POLICY "publicaciones_delete_marketing_above"
  ON public.publicaciones FOR DELETE
  TO authenticated
  USING (public.is_marketing_or_above());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: interacciones — insertar/leer para todos, eliminar solo admin
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.interacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interacciones_select_all"
  ON public.interacciones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "interacciones_insert_community_above"
  ON public.interacciones FOR INSERT
  TO authenticated
  WITH CHECK (public.is_community_or_above());

CREATE POLICY "interacciones_delete_admin"
  ON public.interacciones FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: segmentos — leer todos, gestionar marketing+
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.segmentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "segmentos_select_all"
  ON public.segmentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "segmentos_manage_marketing_above"
  ON public.segmentos FOR ALL
  TO authenticated
  USING (public.is_marketing_or_above())
  WITH CHECK (public.is_marketing_or_above());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: leads
--   - Servicio al Cliente: leer + registrar leads
--   - Marketing+: CRUD completo
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_select_all"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "leads_insert_all_authenticated"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "leads_update_marketing_above"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (public.is_marketing_or_above())
  WITH CHECK (public.is_marketing_or_above());

CREATE POLICY "leads_delete_admin"
  ON public.leads FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: presupuestos — gerencia+ lee, marketing+ gestiona
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presupuestos_select_gerencia_above"
  ON public.presupuestos FOR SELECT
  TO authenticated
  USING (public.is_gerencia_or_above());

CREATE POLICY "presupuestos_manage_marketing_above"
  ON public.presupuestos FOR ALL
  TO authenticated
  USING (public.is_marketing_or_above())
  WITH CHECK (public.is_marketing_or_above());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: prompts_ia — todos leen, todos insertan
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.prompts_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompts_ia_select_all"
  ON public.prompts_ia FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "prompts_ia_insert_all"
  ON public.prompts_ia FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "prompts_ia_delete_admin"
  ON public.prompts_ia FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: contenido_ia — cada usuario ve solo su propio contenido; admin ve todo
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.contenido_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contenido_ia_select_own_or_admin"
  ON public.contenido_ia FOR SELECT
  TO authenticated
  USING (id_usuario = auth.uid() OR public.is_admin());

CREATE POLICY "contenido_ia_insert_own"
  ON public.contenido_ia FOR INSERT
  TO authenticated
  WITH CHECK (id_usuario = auth.uid());

CREATE POLICY "contenido_ia_delete_admin"
  ON public.contenido_ia FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: chatbot_historial — mismo patrón que contenido_ia
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.chatbot_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chatbot_select_own_or_admin"
  ON public.chatbot_historial FOR SELECT
  TO authenticated
  USING (id_usuario = auth.uid() OR public.is_admin());

CREATE POLICY "chatbot_insert_own"
  ON public.chatbot_historial FOR INSERT
  TO authenticated
  WITH CHECK (id_usuario = auth.uid() OR id_usuario IS NULL);

CREATE POLICY "chatbot_delete_admin"
  ON public.chatbot_historial FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: analisis_sentimientos — todos leen, marketing+ gestiona
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.analisis_sentimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sentimientos_select_all"
  ON public.analisis_sentimientos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "sentimientos_manage_marketing_above"
  ON public.analisis_sentimientos FOR ALL
  TO authenticated
  USING (public.is_marketing_or_above())
  WITH CHECK (public.is_marketing_or_above());

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: pagos — gerencia+ lee todos; admin gestiona; marketing+ crea
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_select_gerencia_above"
  ON public.pagos FOR SELECT
  TO authenticated
  USING (public.is_gerencia_or_above());

CREATE POLICY "pagos_insert_marketing_above"
  ON public.pagos FOR INSERT
  TO authenticated
  WITH CHECK (public.is_marketing_or_above());

CREATE POLICY "pagos_update_admin"
  ON public.pagos FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "pagos_delete_admin"
  ON public.pagos FOR DELETE
  TO authenticated
  USING (public.is_admin());
