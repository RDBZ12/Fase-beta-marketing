-- =============================================================================
-- MIGRACIÓN: Aprobación de contenido de campaña con Gemini + vista de Admin
-- Fecha: 2026-07-14
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.configuracion_sistema (
  clave text primary key,
  valor numeric,
  actualizado_por uuid references public.usuarios(id_usuario),
  actualizado_en timestamptz default now()
);

INSERT INTO public.configuracion_sistema (clave, valor) VALUES
  ('precio_minimo_campana', 5.83),
  ('umbral_confianza_moderacion', 0.75)
ON CONFLICT (clave) DO NOTHING;

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS estado_moderacion text DEFAULT 'pendiente';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS resultado_moderacion jsonb;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS fecha_moderacion timestamptz;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS aprobado_por uuid REFERENCES public.usuarios(id_usuario);
