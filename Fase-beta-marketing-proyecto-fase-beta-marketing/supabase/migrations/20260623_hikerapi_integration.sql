-- Añadir columnas para seguimiento de publicaciones en redes sociales
ALTER TABLE public.publicaciones 
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS last_metrics_sync TIMESTAMPTZ;

-- Asegurar que la tabla de interacciones no duplique registros del mismo día
ALTER TABLE public.interacciones 
DROP CONSTRAINT IF EXISTS unique_interaccion_diaria;

ALTER TABLE public.interacciones 
ADD CONSTRAINT unique_interaccion_diaria UNIQUE (id_publicacion, tipo_interaccion, fecha);
