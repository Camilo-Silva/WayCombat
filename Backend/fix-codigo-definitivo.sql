-- ============================================================================
-- FIX DEFINITIVO: Eliminar TODOS los triggers y crear el correcto
-- ============================================================================

-- PASO 1: Eliminar TODOS los triggers existentes de la tabla usuarios
DROP TRIGGER IF EXISTS set_user_code_trigger ON public.usuarios;
DROP TRIGGER IF EXISTS on_auth_user_created ON public.usuarios;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON public.usuarios;
DROP TRIGGER IF EXISTS generate_codigo_trigger ON public.usuarios;
DROP TRIGGER IF EXISTS auto_generate_codigo ON public.usuarios;
DROP TRIGGER IF EXISTS set_codigo_trigger ON public.usuarios;

-- PASO 2: Eliminar funciones viejas que puedan existir
DROP FUNCTION IF EXISTS public.generate_user_code() CASCADE;
DROP FUNCTION IF EXISTS public.generate_user_code_and_set() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.generate_codigo_usuario() CASCADE;

-- PASO 3: Crear LA función correcta para generar código USR-
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

-- PASO 4: Crear LA función del trigger
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

-- PASO 5: Crear EL ÚNICO trigger correcto
CREATE TRIGGER set_user_code_trigger
  BEFORE INSERT ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_user_code_and_set();

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Listar TODOS los triggers de usuarios
SELECT 
  'TRIGGERS ACTIVOS:' as info,
  trigger_name,
  event_manipulation,
  action_timing || ' ' || event_manipulation as cuando,
  action_statement as funcion
FROM information_schema.triggers
WHERE event_object_table = 'usuarios'
  AND trigger_schema = 'public';

-- Listar funciones relacionadas con código
SELECT 
  'FUNCIONES DE CÓDIGO:' as info,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%code%' OR routine_name LIKE '%codigo%')
ORDER BY routine_name;

-- Ver códigos actuales
SELECT 
  'CÓDIGOS ACTUALES:' as info,
  codigo,
  nombre,
  email,
  fecha_creacion
FROM public.usuarios
ORDER BY fecha_creacion DESC;

-- ============================================================================
-- PASO OPCIONAL: Actualizar el código WAY005 a USR-003 manualmente
-- ============================================================================

-- Descomenta si quieres corregir el código del usuario recién creado:
/*
UPDATE public.usuarios
SET codigo = 'USR-003'
WHERE codigo = 'WAY005';
*/

-- ============================================================================
-- PRUEBA: Crear usuario de prueba para verificar
-- ============================================================================
/*
INSERT INTO public.usuarios (id, nombre, email, rol, activo)
VALUES (
  gen_random_uuid(),
  'Test Código',
  'test-codigo@test.com',
  'usuario',
  true
)
RETURNING codigo, nombre, email;
-- Debería devolver: USR-006 (o el siguiente número disponible)
*/
