-- ============================================================================
-- FIX DEFINITIVO: Eliminar trigger viejo y usar solo el nuevo
-- ============================================================================

-- PASO 1: Ver el código actual de handle_new_user para respaldo
SELECT 
  '=== CÓDIGO ACTUAL DE handle_new_user (RESPALDO) ===' as info,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- PASO 2: ELIMINAR el trigger on_auth_user_created de auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- PASO 3: Actualizar handle_new_user para que NO genere código WAY
-- La función ahora solo inserta sin código, y el trigger de usuarios lo genera
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insertar en usuarios SIN código (el trigger set_user_code_trigger lo generará)
  INSERT INTO public.usuarios (
    id,
    nombre,
    email,
    rol,
    activo
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    NEW.email,
    'usuario',
    true
  );
  
  -- También crear el rol en user_roles si existe esa tabla
  INSERT INTO public.user_roles (user_id, role, active)
  VALUES (NEW.id, 'usuario', true)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Si falla, registrar el error pero no bloquear el registro
    RAISE WARNING 'Error en handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- PASO 4: Recrear el trigger on_auth_user_created con la nueva función
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver triggers en auth.users
SELECT 
  '=== TRIGGERS EN auth.users (DEBE ESTAR on_auth_user_created) ===' as info,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_schema = 'auth';

-- Ver triggers en public.usuarios
SELECT 
  '=== TRIGGERS EN public.usuarios (DEBE ESTAR set_user_code_trigger) ===' as info,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'usuarios'
  AND trigger_schema = 'public';

-- Ver el código actualizado de handle_new_user
SELECT 
  '=== CÓDIGO NUEVO DE handle_new_user ===' as info,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- ============================================================================
-- RESUMEN DEL FLUJO CORRECTO
-- ============================================================================
SELECT '
╔═══════════════════════════════════════════════════════════════════════╗
║                    FLUJO CORRECTO DE REGISTRO                         ║
╚═══════════════════════════════════════════════════════════════════════╝

1. Frontend: auth.signUp() 
   → Crea usuario en auth.users

2. Trigger: on_auth_user_created (en auth.users)
   → Ejecuta handle_new_user()
   → INSERT en usuarios SIN código (código = NULL)

3. Trigger: set_user_code_trigger (en public.usuarios) 
   → Se dispara ANTES del INSERT
   → Ejecuta generate_user_code_and_set()
   → Genera código USR-XXX
   → Asigna NEW.codigo = USR-XXX

4. Resultado: Usuario creado con código USR-003, USR-004, etc.

' as resumen;
