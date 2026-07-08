

-- Vista optimizada para obtener el conteo de estados de las publicaciones
CREATE OR REPLACE VIEW publicaciones_stats AS
SELECT 
  estado, 
  COUNT(*) as cantidad
FROM 
  publicaciones
GROUP BY 
  estado;

-- Opcional: otorgar permisos de lectura a la vista (por defecto las vistas heredan permisos, pero es buena práctica asegurarlo si se consulta directo)
GRANT SELECT ON publicaciones_stats TO authenticated;
GRANT SELECT ON publicaciones_stats TO anon;
