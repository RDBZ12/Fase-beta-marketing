-- =============================================================================
-- BOOTSTRAP: Asignar rol Administrador en public.usuarios
-- Proyecto: Marketdev
--
-- La app detecta equipo interno consultando public.usuarios (no perfiles_equipo).
-- Ejecuta en Supabase → SQL Editor.
-- =============================================================================

-- PASO 1: Ver usuarios en Auth
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;

-- PASO 2: Ver perfil en public.usuarios (si existe)
SELECT u.id_usuario, u.correo, u.nombre, u.id_rol, r.nombre_rol
FROM public.usuarios u
LEFT JOIN public.roles r ON r.id_rol = u.id_rol
WHERE u.correo = 'admin@prueba.com';

-- PASO 3: Crear o actualizar fila como Administrador (id_rol = 1)
INSERT INTO public.usuarios (id_usuario, nombre, apellido, correo, id_rol, estado)
SELECT
  au.id,
  'Admin',
  'Prueba',
  au.email,
  1,
  'activo'
FROM auth.users au
WHERE au.email = 'admin@prueba.com'
ON CONFLICT (id_usuario) DO UPDATE SET
  id_rol = 1,
  estado = 'activo',
  correo = EXCLUDED.correo;

-- PASO 4: Verificar
SELECT u.id_usuario, u.correo, u.nombre, u.id_rol, r.nombre_rol
FROM public.usuarios u
JOIN public.roles r ON r.id_rol = u.id_rol
WHERE u.correo = 'admin@prueba.com';
