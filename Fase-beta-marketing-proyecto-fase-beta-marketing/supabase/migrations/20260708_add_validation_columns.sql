-- Agregar columnas de validación a la tabla publicaciones
ALTER TABLE publicaciones 
ADD COLUMN IF NOT EXISTS validacion_estado text DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS validacion_errores jsonb DEFAULT '[]'::jsonb;
