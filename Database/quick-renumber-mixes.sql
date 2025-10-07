-- ============================================
-- QUICK RENUMBER - Reorganizar códigos de Mixes
-- ============================================
-- Uso rápido: Ejecutar después de eliminar Mixes
-- Reorganiza códigos secuencialmente desde MIX-001
-- ============================================

-- Renumerar todos los Mixes ordenados por fecha de creación
WITH numbered_mixes AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY fecha_creacion ASC) AS row_num
  FROM mixes
)
UPDATE mixes
SET codigo = 'MIX-' || LPAD(numbered_mixes.row_num::TEXT, 3, '0')
FROM numbered_mixes
WHERE mixes.id = numbered_mixes.id;

-- Mostrar resultado
SELECT 
  codigo,
  titulo,
  TO_CHAR(fecha_creacion, 'DD/MM/YYYY HH24:MI') as fecha,
  activo
FROM mixes
ORDER BY codigo ASC;

-- Resumen
SELECT 
  COUNT(*) as "Total Mixes",
  MIN(codigo) as "Primer código",
  MAX(codigo) as "Último código"
FROM mixes;
