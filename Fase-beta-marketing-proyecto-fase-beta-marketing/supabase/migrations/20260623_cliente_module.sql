-- ============================================================
-- MIGRACIÓN: Módulo Cliente — Portal Self-Service
-- Proyecto: Marketdev Intelligence System
-- Fecha: 2026-06-23
-- ============================================================

-- ── 1. TABLA: clientes_portal ────────────────────────────────────────────────
-- Perfil extendido del cliente (vinculado a auth.users via Google OAuth)

CREATE TABLE IF NOT EXISTS public.clientes_portal (
  id_cliente    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre        text NOT NULL DEFAULT '',
  apellido      text DEFAULT '',
  email         text NOT NULL DEFAULT '',
  foto_url      text,
  telefono      text,
  empresa       text,
  rnc           text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_portal_auth_user_id
  ON public.clientes_portal (auth_user_id);

ALTER TABLE public.clientes_portal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cliente_portal_own_select" ON public.clientes_portal
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "cliente_portal_own_update" ON public.clientes_portal
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "cliente_portal_own_insert" ON public.clientes_portal
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "service_role_clientes_portal" ON public.clientes_portal
  FOR ALL USING (auth.role() = 'service_role');

-- Equipo interno puede leer todos los clientes
CREATE POLICY "equipo_lee_clientes_portal" ON public.clientes_portal
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id_usuario = auth.uid()
    )
  );

-- ── 2. FUNCIÓN: sincronizar cliente al hacer login ───────────────────────────
-- Se llama desde el frontend tras cada OAuth exitoso
CREATE OR REPLACE FUNCTION public.upsert_cliente_portal(
  p_auth_user_id uuid,
  p_nombre       text,
  p_apellido     text,
  p_email        text,
  p_foto_url     text
)
RETURNS public.clientes_portal
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cliente public.clientes_portal;
BEGIN
  INSERT INTO public.clientes_portal (auth_user_id, nombre, apellido, email, foto_url, updated_at)
  VALUES (p_auth_user_id, p_nombre, p_apellido, p_email, p_foto_url, now())
  ON CONFLICT (auth_user_id) DO UPDATE
    SET nombre     = EXCLUDED.nombre,
        apellido   = EXCLUDED.apellido,
        email      = EXCLUDED.email,
        foto_url   = COALESCE(EXCLUDED.foto_url, clientes_portal.foto_url),
        updated_at = now()
  RETURNING * INTO v_cliente;
  RETURN v_cliente;
END;
$$;

-- ── 3. TABLA: campanas_cliente ───────────────────────────────────────────────
-- Campañas creadas por el cliente desde el portal self-service

CREATE TABLE IF NOT EXISTS public.campanas_cliente (
  id_campana          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cliente          uuid NOT NULL REFERENCES public.clientes_portal(id_cliente) ON DELETE CASCADE,
  nombre_campana      text NOT NULL,
  nombre_negocio      text NOT NULL,
  descripcion_negocio text NOT NULL,
  tipo_producto       text NOT NULL,
  publico_objetivo    text NOT NULL,
  presupuesto         numeric(12, 2) NOT NULL CHECK (presupuesto > 0),
  objetivo_marketing  text NOT NULL,
  estado              text NOT NULL DEFAULT 'borrador'
                      CHECK (estado IN ('borrador', 'activa', 'pausada', 'finalizada')),
  id_pago             uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campanas_cliente_id_cliente
  ON public.campanas_cliente (id_cliente);

ALTER TABLE public.campanas_cliente ENABLE ROW LEVEL SECURITY;

-- Cliente ve y gestiona SOLO sus propias campañas
CREATE POLICY "cliente_ve_sus_campanas" ON public.campanas_cliente
  FOR SELECT USING (
    id_cliente = (
      SELECT id_cliente FROM public.clientes_portal
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "cliente_crea_campanas" ON public.campanas_cliente
  FOR INSERT WITH CHECK (
    id_cliente = (
      SELECT id_cliente FROM public.clientes_portal
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "cliente_edita_campanas" ON public.campanas_cliente
  FOR UPDATE USING (
    id_cliente = (
      SELECT id_cliente FROM public.clientes_portal
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_campanas_cliente" ON public.campanas_cliente
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "equipo_lee_campanas_cliente" ON public.campanas_cliente
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id_usuario = auth.uid())
  );

-- ── 4. TABLA: sugerencias_ia ─────────────────────────────────────────────────
-- Output generado por la IA para cada campaña

CREATE TABLE IF NOT EXISTS public.sugerencias_ia (
  id_sugerencia                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_campana                     uuid UNIQUE NOT NULL
                                 REFERENCES public.campanas_cliente(id_campana) ON DELETE CASCADE,
  estrategia_marketing           text,
  calendario_publicaciones       jsonb DEFAULT '[]'::jsonb,
  textos_publicitarios           jsonb DEFAULT '[]'::jsonb,
  hashtags                       jsonb DEFAULT '[]'::jsonb,
  recomendaciones_segmentacion   text,
  aprobado                       boolean NOT NULL DEFAULT false,
  generated_at                   timestamptz DEFAULT now(),
  approved_at                    timestamptz
);

ALTER TABLE public.sugerencias_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cliente_ve_sus_sugerencias" ON public.sugerencias_ia
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campanas_cliente cc
      JOIN public.clientes_portal cp ON cp.id_cliente = cc.id_cliente
      WHERE cc.id_campana = sugerencias_ia.id_campana
        AND cp.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_sugerencias" ON public.sugerencias_ia
  FOR ALL USING (auth.role() = 'service_role');

-- ── 5. TABLA: publicaciones_cliente ─────────────────────────────────────────
-- Publicaciones programadas y publicadas en Instagram por campaña de cliente

CREATE TABLE IF NOT EXISTS public.publicaciones_cliente (
  id_publicacion    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_campana        uuid NOT NULL
                    REFERENCES public.campanas_cliente(id_campana) ON DELETE CASCADE,
  copy_texto        text NOT NULL,
  hashtags          jsonb DEFAULT '[]'::jsonb,
  imagen_url        text,
  fecha_programada  timestamptz NOT NULL,
  fecha_publicada   timestamptz,
  estado            text NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'publicado', 'fallido', 'cancelado')),
  ayrshare_post_id  text,
  metricas_ig       jsonb DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publicaciones_cliente_campana
  ON public.publicaciones_cliente (id_campana);

CREATE INDEX IF NOT EXISTS idx_publicaciones_cliente_estado
  ON public.publicaciones_cliente (estado);

ALTER TABLE public.publicaciones_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cliente_ve_sus_publicaciones" ON public.publicaciones_cliente
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campanas_cliente cc
      JOIN public.clientes_portal cp ON cp.id_cliente = cc.id_cliente
      WHERE cc.id_campana = publicaciones_cliente.id_campana
        AND cp.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_publicaciones_cliente" ON public.publicaciones_cliente
  FOR ALL USING (auth.role() = 'service_role');

-- ── 6. TABLA: metricas_cliente ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.metricas_cliente (
  id_metrica      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_campana      uuid NOT NULL REFERENCES public.campanas_cliente(id_campana) ON DELETE CASCADE,
  id_publicacion  uuid REFERENCES public.publicaciones_cliente(id_publicacion),
  alcance         integer NOT NULL DEFAULT 0,
  impresiones     integer NOT NULL DEFAULT 0,
  interacciones   integer NOT NULL DEFAULT 0,
  conversiones    integer NOT NULL DEFAULT 0,
  ctr             numeric(5, 2) DEFAULT 0,
  fecha           date NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.metricas_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cliente_ve_sus_metricas" ON public.metricas_cliente
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campanas_cliente cc
      JOIN public.clientes_portal cp ON cp.id_cliente = cc.id_cliente
      WHERE cc.id_campana = metricas_cliente.id_campana
        AND cp.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_metricas_cliente" ON public.metricas_cliente
  FOR ALL USING (auth.role() = 'service_role');

-- ── 7. VERIFICACIÓN ──────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name LIKE '%cliente%'
--   ORDER BY table_name;
