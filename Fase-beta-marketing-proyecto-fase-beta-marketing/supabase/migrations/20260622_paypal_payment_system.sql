-- ============================================================
-- MIGRACIÓN: Sistema de Pagos PayPal + Suscripciones
-- Proyecto: Marketdev Intelligence System
-- Fecha: 2026-06-22
-- ============================================================

-- ── 1. TABLA: suscripciones ───────────────────────────────────────────────────
-- Controla si un usuario tiene acceso activo a la plataforma

CREATE TABLE IF NOT EXISTS public.suscripciones (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id          text NOT NULL DEFAULT 'Plan Pro',
  estado           text NOT NULL DEFAULT 'Activo'
                   CHECK (estado IN ('Activo', 'Inactivo', 'Vencido')),
  fecha_inicio     timestamptz NOT NULL DEFAULT now(),
  fecha_vencimiento timestamptz NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_suscripciones_usuario_id
  ON public.suscripciones (usuario_id);

-- RLS: solo el propio usuario o admins pueden ver su suscripción
ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven su suscripción" ON public.suscripciones
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Service role full access suscripciones" ON public.suscripciones
  FOR ALL USING (auth.role() = 'service_role');

-- ── 2. TABLA: campaigns (actualización) ──────────────────────────────────────
-- Agrega campos financieros si no existen

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS presupuesto    numeric(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usuario_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Asegura que el estado por defecto es 'Pendiente de Pago' para campañas nuevas
-- NOTA: Solo modifica el DEFAULT, no afecta registros existentes
ALTER TABLE public.campaigns
  ALTER COLUMN estado SET DEFAULT 'Pendiente de Pago';

-- ── 3. TABLA: pagos (nueva estructura robusta) ───────────────────────────────
-- Si ya existe la tabla pagos con otra estructura, la actualizamos con ALTER

-- Agregar columnas faltantes si la tabla ya existe
ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS paypal_order_id  text UNIQUE,
  ADD COLUMN IF NOT EXISTS itbis            numeric(12, 2),
  ADD COLUMN IF NOT EXISTS total_con_itbis  numeric(12, 2),
  ADD COLUMN IF NOT EXISTS tipo_comprobante text DEFAULT 'Factura de Consumo';

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_pagos_campana_id
  ON public.pagos (id_campana);

CREATE INDEX IF NOT EXISTS idx_pagos_paypal_order_id
  ON public.pagos (paypal_order_id);

-- ── 4. FUNCIÓN: generar_ncf ───────────────────────────────────────────────────
-- Genera NCF único con formato dominicano (E31XXXXXXXXXX)
-- La Edge Function genera el NCF directamente en TypeScript, pero esta función
-- puede usarse como fallback desde el cliente.

CREATE OR REPLACE FUNCTION public.generar_ncf()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _count   integer;
  _secuencia text;
BEGIN
  SELECT COUNT(*) + 1 INTO _count FROM public.pagos;
  _secuencia := lpad(_count::text, 10, '0');
  RETURN 'E31' || _secuencia;
END;
$$;

-- ── 5. RLS en pagos ──────────────────────────────────────────────────────────
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- La Edge Function usa service_role y puede hacer cualquier operación
CREATE POLICY "Service role full access pagos" ON public.pagos
  FOR ALL USING (auth.role() = 'service_role');

-- Admins y equipo interno pueden leer pagos
CREATE POLICY "Equipo puede leer pagos" ON public.pagos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id_usuario = auth.uid()
        AND u.id_rol IN (1, 2, 3)  -- Admin, Gerencia, Marketing
    )
  );

-- ── 6. RLS en campaigns para pagos ──────────────────────────────────────────
-- La Edge Function necesita actualizar el estado de campaigns
CREATE POLICY "Service role full access campaigns" ON public.campaigns
  FOR ALL USING (auth.role() = 'service_role');

-- ── 7. SUSCRIPCIÓN DE PRUEBA para el admin ───────────────────────────────────
-- Inserta una suscripción activa para admin@prueba.com si existe en auth.users

INSERT INTO public.suscripciones (usuario_id, plan_id, estado, fecha_inicio, fecha_vencimiento)
SELECT
  au.id,
  'Plan Pro',
  'Activo',
  now(),
  now() + INTERVAL '1 year'
FROM auth.users au
WHERE au.email = 'admin@prueba.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.suscripciones s WHERE s.usuario_id = au.id
  );

-- ── VERIFICACIÓN FINAL ───────────────────────────────────────────────────────
-- Ejecuta esto para confirmar que todo quedó bien:

-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   ORDER BY table_name;

-- SELECT * FROM public.suscripciones;
