-- ============================================
-- AGREGAR CAMPOS CODIGO A TABLAS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. AGREGAR COLUMNA CODIGO A TABLA MIXES
-- ============================================
ALTER TABLE mixes 
ADD COLUMN IF NOT EXISTS codigo VARCHAR(20) UNIQUE;

-- Generar códigos para registros existentes de mixes
-- Formato: MIX-001, MIX-002, MIX-003, etc.
WITH numbered_mixes AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY fecha_creacion) AS row_num
  FROM mixes
  WHERE codigo IS NULL
)
UPDATE mixes
SET codigo = 'MIX-' || LPAD(numbered_mixes.row_num::TEXT, 3, '0')
FROM numbered_mixes
WHERE mixes.id = numbered_mixes.id;

-- 2. AGREGAR COLUMNA CODIGO A TABLA USUARIOS
-- ============================================
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS codigo VARCHAR(20) UNIQUE;

-- Generar códigos para usuarios existentes
-- Formato: USR-001, USR-002, USR-003, etc.
WITH numbered_usuarios AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY fecha_creacion) AS row_num
  FROM usuarios
  WHERE codigo IS NULL
)
UPDATE usuarios
SET codigo = 'USR-' || LPAD(numbered_usuarios.row_num::TEXT, 3, '0')
FROM numbered_usuarios
WHERE usuarios.id = numbered_usuarios.id;

-- 3. FUNCIÓN PARA AUTO-GENERAR CÓDIGO DE MIX
-- ============================================
CREATE OR REPLACE FUNCTION generate_mix_codigo()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  -- Solo generar si no viene código
  IF NEW.codigo IS NULL THEN
    -- Obtener el siguiente número secuencial
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM mixes
    WHERE codigo LIKE 'MIX-%';
    
    -- Asignar código con formato MIX-XXX (3 dígitos)
    NEW.codigo := 'MIX-' || LPAD(next_num::TEXT, 3, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGER PARA MIXES
-- ============================================
DROP TRIGGER IF EXISTS set_mix_codigo ON mixes;

CREATE TRIGGER set_mix_codigo
BEFORE INSERT ON mixes
FOR EACH ROW
EXECUTE FUNCTION generate_mix_codigo();

-- 5. FUNCIÓN PARA AUTO-GENERAR CÓDIGO DE USUARIO
-- ============================================
CREATE OR REPLACE FUNCTION generate_usuario_codigo()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  -- Solo generar si no viene código
  IF NEW.codigo IS NULL THEN
    -- Obtener el siguiente número secuencial
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM usuarios
    WHERE codigo LIKE 'USR-%';
    
    -- Asignar código con formato USR-XXX (3 dígitos)
    NEW.codigo := 'USR-' || LPAD(next_num::TEXT, 3, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGER PARA USUARIOS
-- ============================================
DROP TRIGGER IF EXISTS set_usuario_codigo ON usuarios;

CREATE TRIGGER set_usuario_codigo
BEFORE INSERT ON usuarios
FOR EACH ROW
EXECUTE FUNCTION generate_usuario_codigo();

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Verificar que los códigos se generaron correctamente
SELECT id, codigo, titulo, fecha_creacion 
FROM mixes 
ORDER BY codigo;

SELECT id, codigo, nombre, email, fecha_creacion 
FROM usuarios 
ORDER BY codigo;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Los códigos se generan automáticamente al crear nuevos registros
-- 2. El formato es: MIX-001, MIX-002, ... / USR-001, USR-002, ...
-- 3. Los códigos son únicos y no se pueden duplicar
-- 4. Si eliminas un registro, su código no se reutiliza (secuencial)
-- 5. Los usuarios verán estos códigos en lugar de los UUIDs
