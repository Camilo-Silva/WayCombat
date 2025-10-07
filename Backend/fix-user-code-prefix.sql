-- ============================================================================
-- FIX: Cambiar prefijo de código de usuario de "WAY" a "USR"
-- ============================================================================
-- Este script actualiza la función que genera códigos de usuario
-- Cambio: WAY001, WAY002... → USR-001, USR-002...
-- ============================================================================

-- PASO 1: Eliminar función antigua si existe
DROP FUNCTION IF EXISTS public.generate_user_code();

-- PASO 2: Crear nueva función con prefijo USR-
CREATE OR REPLACE FUNCTION public.generate_user_code()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  max_usr INTEGER;
  max_way INTEGER;
  new_code TEXT;
BEGIN
  -- Obtener el número más alto de códigos USR-XXX
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(codigo FROM 'USR-(\d+)') AS INTEGER
      )
    ), 0
  )
  INTO max_usr
  FROM public.usuarios
  WHERE codigo ~ '^USR-\d+$';
  
  -- Obtener el número más alto de códigos WAYXXX (sin guion)
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(codigo FROM 'WAY(\d+)') AS INTEGER
      )
    ), 0
  )
  INTO max_way
  FROM public.usuarios
  WHERE codigo ~ '^WAY\d+$';
  
  -- Tomar el máximo entre ambos y sumar 1
  next_number := GREATEST(max_usr, max_way) + 1;
  
  -- Generar código con formato USR-XXX (3 dígitos mínimo)
  new_code := 'USR-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Crear función que el trigger usará (ANTES del trigger)
CREATE OR REPLACE FUNCTION public.generate_user_code_and_set()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo generar código si es NULL o vacío
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := public.generate_user_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 4: Crear o reemplazar trigger para auto-generar código
DROP TRIGGER IF EXISTS set_user_code_trigger ON public.usuarios;

CREATE TRIGGER set_user_code_trigger
  BEFORE INSERT ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_user_code_and_set();

-- ============================================================================
-- PASO 5: (OPCIONAL) Actualizar códigos existentes de WAY a USR
-- ============================================================================
-- ⚠️ DESCOMENTAR solo si quieres migrar códigos existentes

/*
UPDATE public.usuarios
SET codigo = REPLACE(codigo, 'WAY', 'USR-')
WHERE codigo LIKE 'WAY%';
*/

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver función creada
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'generate_user_code';

-- Ver triggers en la tabla usuarios
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'usuarios'
  AND trigger_schema = 'public';

-- Ver códigos actuales
SELECT id, codigo, nombre, email, rol
FROM public.usuarios
ORDER BY fecha_creacion DESC
LIMIT 10;

-- ============================================================================
-- PRUEBA: Insertar usuario de prueba (OPCIONAL)
-- ============================================================================
/*
INSERT INTO public.usuarios (id, nombre, email, rol, activo)
VALUES (
  gen_random_uuid(),
  'Usuario Prueba',
  'prueba@test.com',
  'usuario',
  true
)
RETURNING codigo, nombre, email;
*/

-- ============================================================================
-- NOTAS:
-- - Los nuevos usuarios tendrán códigos USR-001, USR-002, etc.
-- - Los códigos WAY existentes NO se modifican automáticamente
-- - Para migrar códigos existentes, descomenta la sección UPDATE
-- ============================================================================
