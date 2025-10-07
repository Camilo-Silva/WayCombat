-- ============================================================================
-- VER CÓDIGO COMPLETO DE handle_new_user
-- ============================================================================

-- 1. Ver el código completo de la función
SELECT 
  '=== CÓDIGO DE handle_new_user ===' as separador,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- 2. Ver qué trigger llama a esta función
SELECT 
  '=== TRIGGERS QUE USAN handle_new_user ===' as separador,
  trigger_schema,
  trigger_name,
  event_object_schema,
  event_object_table,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%handle_new_user%';

-- 3. Ver si existe un trigger en auth.users
SELECT 
  '=== TRIGGERS EN auth.users ===' as separador,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_schema = 'auth';
