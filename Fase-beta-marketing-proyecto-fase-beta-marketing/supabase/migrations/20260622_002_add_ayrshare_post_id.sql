-- Agregar columna ayrshare_post_id a la tabla publicaciones
-- Esta columna guarda el ID del post que devuelve Ayrshare al publicar,
-- lo que permite consultar las analíticas reales por post específico.

ALTER TABLE public.publicaciones
  ADD COLUMN IF NOT EXISTS ayrshare_post_id TEXT;

COMMENT ON COLUMN public.publicaciones.ayrshare_post_id IS 
  'ID del post en Ayrshare. Se guarda al publicar para poder consultar analíticas reales por post.';
