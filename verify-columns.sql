-- Verificar TODAS las columnas de archivo_mixes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'archivo_mixes'
ORDER BY ordinal_position;
