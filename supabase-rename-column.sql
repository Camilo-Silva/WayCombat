-- Renombrar columna tamaño_bytes a tamano_bytes (sin ñ)
-- Ejecutar en Supabase SQL Editor

-- Primero verificamos si existe la columna antigua
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'archivo_mixes' 
  AND column_name LIKE '%tama%';

-- Renombramos la columna (sin ñ para compatibilidad PostgreSQL)
ALTER TABLE archivo_mixes 
RENAME COLUMN tamaño_bytes TO tamano_bytes;

-- Verificamos el cambio
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'archivo_mixes' 
  AND column_name LIKE '%tama%';
