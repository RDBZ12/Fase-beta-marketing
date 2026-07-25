-- =============================================================================
-- MIGRACIÓN 003: Datos iniciales (seed)
-- Proyecto Integrador UTESA — Marketdev
-- Fecha: 2026-06-20
-- EJECUTAR DESPUÉS de 002_rls_policies.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ROLES del sistema (según sección 9 del diseño)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.roles (id_rol, nombre_rol, descripcion) VALUES
  (1, 'Administrador',      'Acceso total al sistema: usuarios, roles, clientes, campañas, publicaciones, reportes.'),
  (2, 'Gerencia',           'Consultar campañas, aprobar campañas, consultar reportes y estadísticas, consultar clientes.'),
  (3, 'Marketing',          'Crear y modificar campañas, gestionar publicaciones, consultar métricas y clientes.'),
  (4, 'Community Manager',  'Crear y programar publicaciones, consultar campañas, gestionar redes sociales.'),
  (5, 'Servicio al Cliente','Consultar clientes, registrar consultas, gestionar leads, consultar información básica.')
ON CONFLICT (id_rol) DO UPDATE
  SET nombre_rol  = EXCLUDED.nombre_rol,
      descripcion = EXCLUDED.descripcion;

-- Resetear secuencia para que el próximo id_rol auto sea > 5
SELECT SETVAL('public.roles_id_rol_seq', 5, true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. REDES SOCIALES disponibles
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.redes_sociales (nombre_red, url, estado, icono) VALUES
  ('Facebook',   'https://facebook.com',   'activo', 'facebook'),
  ('Instagram',  'https://instagram.com',  'activo', 'instagram'),
  ('Twitter/X',  'https://x.com',          'activo', 'twitter'),
  ('LinkedIn',   'https://linkedin.com',   'activo', 'linkedin'),
  ('TikTok',     'https://tiktok.com',     'activo', 'tiktok'),
  ('YouTube',    'https://youtube.com',    'activo', 'youtube'),
  ('WhatsApp',   'https://whatsapp.com',   'activo', 'message-circle'),
  ('Email',      '',                       'activo', 'mail')
ON CONFLICT (nombre_red) DO UPDATE
  SET url    = EXCLUDED.url,
      estado = EXCLUDED.estado,
      icono  = EXCLUDED.icono;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TIPOS DE CONTENIDO para publicaciones
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.tipos_contenido (nombre_tipo, descripcion) VALUES
  ('Imagen Estática',   'Publicación con una sola imagen fija'),
  ('Video',             'Publicación con contenido de video'),
  ('Carrusel',          'Publicación con múltiples imágenes deslizables'),
  ('Historia / Story',  'Contenido temporal de 24 horas'),
  ('Texto',             'Publicación solo de texto, sin multimedia'),
  ('GIF / Animado',     'Imagen animada o GIF'),
  ('Reels / Short',     'Video corto de formato vertical'),
  ('Email HTML',        'Campaña de correo electrónico en formato HTML'),
  ('Newsletter',        'Boletín informativo periódico'),
  ('Banner Display',    'Banner publicitario para sitios web')
ON CONFLICT (nombre_tipo) DO UPDATE
  SET descripcion = EXCLUDED.descripcion;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SEGMENTOS de mercado iniciales
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.segmentos (nombre_segmento, descripcion) VALUES
  ('Millennials',       'Usuarios entre 25-40 años, alta interacción digital'),
  ('Empresas PYME',     'Pequeñas y medianas empresas del sector'),
  ('Corporativo',       'Grandes corporaciones y grupos empresariales'),
  ('Consumidor Final',  'Cliente directo, retail'),
  ('Distribuidor',      'Canales de distribución y mayoristas'),
  ('Premium',           'Segmento de alto valor, productos premium')
ON CONFLICT (nombre_segmento) DO UPDATE
  SET descripcion = EXCLUDED.descripcion;
