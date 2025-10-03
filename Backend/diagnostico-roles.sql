-- ================================================
-- DIAGNÓSTICO: Ver qué valores de rol existen
-- ================================================

-- Ver TODOS los valores únicos de rol (incluyendo NULL)
SELECT 
  COALESCE(rol, '(NULL)') as rol_actual,
  COUNT(*) as cantidad,
  STRING_AGG(DISTINCT email, ', ') as ejemplos_usuarios
FROM usuarios
GROUP BY rol
ORDER BY cantidad DESC;

-- Ver si hay valores con espacios o caracteres raros
SELECT 
  rol,
  LENGTH(rol) as longitud,
  encode(rol::bytea, 'escape') as bytes,
  email
FROM usuarios
WHERE rol IS NOT NULL
ORDER BY rol;
