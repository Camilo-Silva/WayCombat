-- ============================================================================
-- DIAGNÓSTICO COMPLETO: Buscar TODOS los triggers relacionados con usuarios
-- ============================================================================

-- 1. Triggers en la tabla public.usuarios
SELECT 
  'TRIGGERS EN public.usuarios:' as info,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'usuarios'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

-- 2. Triggers en la tabla auth.users (estos se disparan al crear en Auth)
SELECT 
  'TRIGGERS EN auth.users:' as info,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_schema = 'auth'
ORDER BY trigger_name;

-- 3. TODAS las funciones que contengan "code" o "codigo" en el nombre
SELECT 
  'FUNCIONES DE CÓDIGO:' as info,
  routine_schema,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE (routine_name LIKE '%code%' OR routine_name LIKE '%codigo%')
  AND routine_schema IN ('public', 'auth')
ORDER BY routine_name;

-- 4. Ver el código de la función generate_user_code_and_set
SELECT 
  'CÓDIGO DE generate_user_code_and_set:' as info,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'generate_user_code_and_set'
  AND routine_schema = 'public';

-- 5. Ver el código de la función generate_user_code
SELECT 
  'CÓDIGO DE generate_user_code:' as info,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'generate_user_code'
  AND routine_schema = 'public';

-- ============================================================================
-- DIAGNÓSTICO: ¿Qué genera el código WAY?
-- ============================================================================

-- 6. Buscar funciones que contengan "WAY" en su definición
SELECT 
  'FUNCIONES CON "WAY" EN EL CÓDIGO:' as info,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%WAY%'
  AND routine_schema = 'public';
