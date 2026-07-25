-- =============================================================================
-- FIX: Diagnóstico y corrección del error "column correo does not exist"
-- EJECUTAR ESTE SCRIPT PRIMERO antes de volver a correr los otros
-- =============================================================================

-- PASO 1: Ver qué columnas tiene la tabla usuarios (si existe)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- Si ves columnas aquí con nombres distintos (ej: "email" en vez de "correo"),
-- ejecuta el PASO 2 abajo. Si la tabla no existe o está vacía, salta al PASO 3.

-- =============================================================================
-- PASO 2: Eliminar tablas con conflicto (en orden correcto por FK)
-- Solo ejecuta si el diagnóstico mostró columnas incorrectas.
-- =============================================================================

DROP TABLE IF EXISTS public.pagos                CASCADE;
DROP TABLE IF EXISTS public.chatbot_historial     CASCADE;
DROP TABLE IF EXISTS public.contenido_ia          CASCADE;
DROP TABLE IF EXISTS public.prompts_ia            CASCADE;
DROP TABLE IF EXISTS public.analisis_sentimientos CASCADE;
DROP TABLE IF EXISTS public.presupuestos          CASCADE;
DROP TABLE IF EXISTS public.leads                 CASCADE;
DROP TABLE IF EXISTS public.segmentos             CASCADE;
DROP TABLE IF EXISTS public.interacciones         CASCADE;
DROP TABLE IF EXISTS public.publicaciones         CASCADE;
DROP TABLE IF EXISTS public.tipos_contenido       CASCADE;
DROP TABLE IF EXISTS public.redes_sociales        CASCADE;
DROP TABLE IF EXISTS public.campaigns             CASCADE;
DROP TABLE IF EXISTS public.clientes              CASCADE;
DROP TABLE IF EXISTS public.usuarios              CASCADE;
DROP TABLE IF EXISTS public.roles                 CASCADE;

DROP SEQUENCE IF EXISTS public.ncf_sequence;
DROP FUNCTION IF EXISTS public.generar_ncf()                CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column()   CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user()            CASCADE;
DROP FUNCTION IF EXISTS public.get_user_rol()               CASCADE;
DROP FUNCTION IF EXISTS public.is_admin()                   CASCADE;
DROP FUNCTION IF EXISTS public.is_gerencia_or_above()       CASCADE;
DROP FUNCTION IF EXISTS public.is_marketing_or_above()      CASCADE;
DROP FUNCTION IF EXISTS public.is_community_or_above()      CASCADE;

-- También eliminar el trigger del schema auth si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =============================================================================
-- PASO 3: Verificar que quedó limpio
-- =============================================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'roles','usuarios','clientes','campaigns','redes_sociales',
    'tipos_contenido','publicaciones','interacciones','segmentos',
    'leads','presupuestos','prompts_ia','contenido_ia',
    'chatbot_historial','analisis_sentimientos','pagos'
  )
ORDER BY table_name;

-- Si esta query devuelve filas vacías → ya puedes correr los scripts 001, 002 y 003 en orden.
