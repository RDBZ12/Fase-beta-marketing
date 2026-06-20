-- =============================================================================
-- MIGRACIÓN 001: Esquema inicial del Sistema Inteligente de Marketing con IA
-- Proyecto Integrador UTESA — Marketdev
-- Fecha: 2026-06-20
-- INSTRUCCIONES: Ejecutar este archivo en Supabase > SQL Editor (en orden)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLA: roles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
  id_rol    SERIAL PRIMARY KEY,
  nombre_rol VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT
);

COMMENT ON TABLE public.roles IS 'Roles del sistema: Administrador, Gerencia, Marketing, Community Manager, Servicio al Cliente';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TABLA: usuarios
-- Extiende auth.users de Supabase con datos del perfil y rol
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usuarios (
  id_usuario  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      VARCHAR(100) NOT NULL,
  apellido    VARCHAR(100) NOT NULL,
  correo      VARCHAR(255) NOT NULL UNIQUE,
  telefono    VARCHAR(20),
  estado      VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  id_rol      INTEGER NOT NULL REFERENCES public.roles(id_rol) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_correo  ON public.usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado  ON public.usuarios(estado);
CREATE INDEX IF NOT EXISTS idx_usuarios_id_rol  ON public.usuarios(id_rol);

COMMENT ON TABLE public.usuarios IS 'Perfil de usuarios del sistema vinculado a Supabase Auth';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TABLA: clientes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clientes (
  id_cliente    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_empresa VARCHAR(200) NOT NULL,
  contacto      VARCHAR(150),
  telefono      VARCHAR(20) NOT NULL,
  correo        VARCHAR(255),
  direccion     TEXT,
  estado        VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_correo    ON public.clientes(correo);
CREATE INDEX IF NOT EXISTS idx_clientes_estado    ON public.clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa   ON public.clientes(nombre_empresa);

COMMENT ON TABLE public.clientes IS 'Clientes de la empresa registrados en el sistema';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TABLA: campaigns (reemplaza y extiende tobacco_products)
--    Mantiene compatibilidad: brand e image_url son campos sectoriales opcionales
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaigns (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Campos del diseño ER
  nombre_campana VARCHAR(200) NOT NULL,
  descripcion   TEXT,
  objetivo      TEXT,
  presupuesto   NUMERIC(12,2) DEFAULT 0 CHECK (presupuesto >= 0),
  fecha_inicio  DATE,
  fecha_fin     DATE,
  estado        VARCHAR(20) NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa', 'Pausada', 'Completada', 'Borrador')),
  id_cliente    UUID REFERENCES public.clientes(id_cliente) ON DELETE SET NULL,
  id_usuario    UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
  -- Campos heredados de tobacco_products (compatibilidad con frontend actual)
  brand         VARCHAR(100),
  image_url     TEXT,
  channel       VARCHAR(20) DEFAULT 'Multi' CHECK (channel IN ('Email', 'Social', 'Display', 'Multi')),
  leads         INTEGER DEFAULT 0 CHECK (leads >= 0),
  reach         VARCHAR(20) DEFAULT '0',
  ctr           NUMERIC(5,2) DEFAULT 0.0 CHECK (ctr >= 0),
  start_date    VARCHAR(50),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Validación de fechas
  CONSTRAINT check_fechas CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio),
  -- Validación de presupuesto
  CONSTRAINT check_presupuesto CHECK (presupuesto >= 0)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_estado      ON public.campaigns(estado);
CREATE INDEX IF NOT EXISTS idx_campaigns_fecha_inicio ON public.campaigns(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_campaigns_id_cliente  ON public.campaigns(id_cliente);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at  ON public.campaigns(created_at);

COMMENT ON TABLE public.campaigns IS 'Campañas publicitarias. Migrada desde tobacco_products. brand/image_url/channel/leads/reach/ctr/start_date conservados por compatibilidad.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. MIGRAR DATOS: tobacco_products → campaigns
--    Solo ejecuta si tobacco_products tiene filas. Si está vacía, no hace nada.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tobacco_products'
  ) THEN
    INSERT INTO public.campaigns (
      id,
      nombre_campana,
      descripcion,
      estado,
      brand,
      image_url,
      channel,
      leads,
      reach,
      ctr,
      start_date,
      created_at
    )
    SELECT
      id,
      name                                AS nombre_campana,
      COALESCE(brand, '')                 AS descripcion,
      COALESCE(status, 'Activa')          AS estado,
      brand,
      image_url,
      COALESCE(channel, 'Multi')          AS channel,
      COALESCE(leads, 0)                  AS leads,
      COALESCE(reach, '0')                AS reach,
      COALESCE(ctr, 0.0)                  AS ctr,
      start_date,
      COALESCE(created_at, NOW())         AS created_at
    FROM public.tobacco_products
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Datos migrados desde tobacco_products a campaigns.';
  ELSE
    RAISE NOTICE 'Tabla tobacco_products no existe — no hay datos que migrar.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. TABLA: redes_sociales
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.redes_sociales (
  id_red      SERIAL PRIMARY KEY,
  nombre_red  VARCHAR(100) NOT NULL UNIQUE,
  url         TEXT,
  estado      VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  icono       VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.redes_sociales IS 'Plataformas de redes sociales disponibles para publicaciones';

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. TABLA: tipos_contenido
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tipos_contenido (
  id_tipo_contenido SERIAL PRIMARY KEY,
  nombre_tipo       VARCHAR(100) NOT NULL UNIQUE,
  descripcion       TEXT
);

COMMENT ON TABLE public.tipos_contenido IS 'Tipos de contenido para publicaciones: imagen, video, texto, carrusel, etc.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. TABLA: publicaciones
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.publicaciones (
  id_publicacion    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo            VARCHAR(300) NOT NULL,
  contenido         TEXT NOT NULL,
  fecha_publicacion TIMESTAMPTZ NOT NULL,
  estado            VARCHAR(30) NOT NULL DEFAULT 'Programada' CHECK (estado IN ('Programada', 'Publicada', 'Borrador', 'Cancelada')),
  id_campana        UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  id_red            INTEGER REFERENCES public.redes_sociales(id_red) ON DELETE SET NULL,
  id_tipo_contenido INTEGER REFERENCES public.tipos_contenido(id_tipo_contenido) ON DELETE SET NULL,
  imagen_url        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publicaciones_estado           ON public.publicaciones(estado);
CREATE INDEX IF NOT EXISTS idx_publicaciones_fecha            ON public.publicaciones(fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_publicaciones_id_campana       ON public.publicaciones(id_campana);

COMMENT ON TABLE public.publicaciones IS 'Publicaciones digitales asociadas a campañas y redes sociales';

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. TABLA: interacciones
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interacciones (
  id_interaccion   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo_interaccion VARCHAR(50) NOT NULL CHECK (tipo_interaccion IN ('like', 'comentario', 'compartido', 'alcance', 'click', 'impresion')),
  cantidad         INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  fecha            DATE NOT NULL DEFAULT CURRENT_DATE,
  id_publicacion   UUID REFERENCES public.publicaciones(id_publicacion) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_interacciones_fecha          ON public.interacciones(fecha);
CREATE INDEX IF NOT EXISTS idx_interacciones_id_publicacion ON public.interacciones(id_publicacion);

COMMENT ON TABLE public.interacciones IS 'Métricas e interacciones de publicaciones en redes sociales';

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. TABLA: segmentos
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.segmentos (
  id_segmento      SERIAL PRIMARY KEY,
  nombre_segmento  VARCHAR(100) NOT NULL UNIQUE,
  descripcion      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.segmentos IS 'Segmentos de mercado para clasificar leads';

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. TABLA: leads
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id_lead         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(150) NOT NULL,
  telefono        VARCHAR(20),
  correo          VARCHAR(255),
  interes         TEXT,
  estado          VARCHAR(30) NOT NULL DEFAULT 'Nuevo' CHECK (estado IN ('Nuevo', 'Contactado', 'Calificado', 'Convertido', 'Perdido')),
  fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_campana      UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  id_segmento     INTEGER REFERENCES public.segmentos(id_segmento) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_correo       ON public.leads(correo);
CREATE INDEX IF NOT EXISTS idx_leads_estado       ON public.leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_fecha        ON public.leads(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_leads_id_campana   ON public.leads(id_campana);
CREATE INDEX IF NOT EXISTS idx_leads_id_segmento  ON public.leads(id_segmento);

COMMENT ON TABLE public.leads IS 'Clientes potenciales generados por campañas publicitarias';

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. TABLA: presupuestos
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.presupuestos (
  id_presupuesto  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monto           NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  descripcion     TEXT,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  id_campana      UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presupuestos_id_campana ON public.presupuestos(id_campana);
CREATE INDEX IF NOT EXISTS idx_presupuestos_fecha      ON public.presupuestos(fecha);

COMMENT ON TABLE public.presupuestos IS 'Presupuestos asignados por campaña';

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. TABLA: prompts_ia
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prompts_ia (
  id_prompt   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modo        VARCHAR(50) NOT NULL,   -- 'generador', 'chatbot', 'analisis'
  prompt      TEXT NOT NULL,
  tipo        VARCHAR(50),            -- 'Email', 'Social', 'Display', 'Multi'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.prompts_ia IS 'Prompts enviados a la IA (Gemini API)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. TABLA: contenido_ia
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contenido_ia (
  id_contenido  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_prompt     UUID REFERENCES public.prompts_ia(id_prompt) ON DELETE SET NULL,
  respuesta_ia  TEXT NOT NULL,
  fecha         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_usuario    UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
  canal         VARCHAR(20),  -- canal de contexto usado
  tema          VARCHAR(300)  -- tema/producto ingresado
);

CREATE INDEX IF NOT EXISTS idx_contenido_ia_fecha     ON public.contenido_ia(fecha);
CREATE INDEX IF NOT EXISTS idx_contenido_ia_usuario   ON public.contenido_ia(id_usuario);

COMMENT ON TABLE public.contenido_ia IS 'Contenido publicitario generado por la IA (Gemini API)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. TABLA: chatbot_historial
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chatbot_historial (
  id_chat    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pregunta   TEXT NOT NULL,
  respuesta  TEXT NOT NULL,
  fecha      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_usuario UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_chatbot_fecha   ON public.chatbot_historial(fecha);
CREATE INDEX IF NOT EXISTS idx_chatbot_usuario ON public.chatbot_historial(id_usuario);

COMMENT ON TABLE public.chatbot_historial IS 'Historial de conversaciones del chatbot inteligente';

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. TABLA: analisis_sentimientos
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analisis_sentimientos (
  id_analisis    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comentario     TEXT NOT NULL,
  sentimiento    VARCHAR(20) CHECK (sentimiento IN ('positivo', 'negativo', 'neutro')),
  confianza      NUMERIC(5,4) CHECK (confianza BETWEEN 0 AND 1),
  fecha          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_publicacion UUID REFERENCES public.publicaciones(id_publicacion) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sentimientos_fecha         ON public.analisis_sentimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_sentimientos_publicacion   ON public.analisis_sentimientos(id_publicacion);

COMMENT ON TABLE public.analisis_sentimientos IS 'Análisis de sentimientos de comentarios en publicaciones';

-- ─────────────────────────────────────────────────────────────────────────────
-- 18. TABLA: pagos
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pagos (
  id_pago            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_campana         UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  monto              NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  itbis              NUMERIC(12,2) GENERATED ALWAYS AS (ROUND(monto * 0.18, 2)) STORED,
  total_con_itbis    NUMERIC(12,2) GENERATED ALWAYS AS (ROUND(monto * 1.18, 2)) STORED,
  ncf                VARCHAR(20) UNIQUE,  -- Formato: E310000000001
  estado_dgii        VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado_dgii IN ('Pendiente', 'Aceptado', 'Rechazado')),
  metodo_pago        VARCHAR(30) DEFAULT 'PayPal' CHECK (metodo_pago IN ('PayPal', 'Transferencia', 'Efectivo', 'Tarjeta')),
  paypal_order_id    VARCHAR(100),        -- ID de orden de PayPal
  paypal_status      VARCHAR(30),         -- COMPLETED, APPROVED, etc.
  rnc_cedula         VARCHAR(20),         -- RNC o Cédula del receptor
  razon_social       VARCHAR(200),        -- Razón social del receptor
  tipo_comprobante   VARCHAR(50) DEFAULT 'Factura de Consumo',
  comprobante_pdf_url TEXT,
  fecha              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_usuario         UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pagos_fecha      ON public.pagos(fecha);
CREATE INDEX IF NOT EXISTS idx_pagos_id_campana ON public.pagos(id_campana);
CREATE INDEX IF NOT EXISTS idx_pagos_ncf        ON public.pagos(ncf);
CREATE INDEX IF NOT EXISTS idx_pagos_estado     ON public.pagos(estado_dgii);

COMMENT ON TABLE public.pagos IS 'Pagos de campañas con integración PayPal y comprobante NCF dominicano';

-- ─────────────────────────────────────────────────────────────────────────────
-- 19. SECUENCIA NCF — para generar números E310000000001 incrementales
-- ─────────────────────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS ncf_sequence
  START WITH 1
  INCREMENT BY 1
  NO MAXVALUE
  CACHE 1;

-- Función para generar el próximo NCF en formato dominicano E31XXXXXXXXX
CREATE OR REPLACE FUNCTION public.generar_ncf()
RETURNS VARCHAR(20) AS $$
DECLARE
  next_val BIGINT;
BEGIN
  next_val := NEXTVAL('ncf_sequence');
  RETURN 'E31' || LPAD(next_val::TEXT, 10, '0');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generar_ncf() IS 'Genera un NCF único en formato dominicano: E31XXXXXXXXXX';

-- ─────────────────────────────────────────────────────────────────────────────
-- 20. FUNCIÓN: updated_at automático (trigger helper)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
CREATE TRIGGER tr_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_publicaciones_updated_at
  BEFORE UPDATE ON public.publicaciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 21. FUNCIÓN: crear perfil de usuario automáticamente al registrarse en Auth
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id_usuario, nombre, apellido, correo, id_rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'id_rol')::INTEGER, 3)  -- Default: Marketing (rol 3)
  )
  ON CONFLICT (id_usuario) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: al crear usuario en auth.users → insertar en public.usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automáticamente el perfil en public.usuarios al registrar en Supabase Auth';
