-- ============================================================================
-- LIMPIEZA DE USUARIO CORRUPTO
-- ============================================================================
-- Usuario ID: 548e3b4e-14be-4d50-8925-5b5a11054c86
-- Problema: Existe en auth.users pero NO en tabla usuarios
-- Solución: Eliminar de auth.users para permitir re-registro
-- ============================================================================

-- Ver el usuario corrupto en auth
SELECT id, email, created_at, confirmed_at
FROM auth.users
WHERE id = '548e3b4e-14be-4d50-8925-5b5a11054c86';

-- Verificar que NO existe en tabla usuarios
SELECT * FROM public.usuarios
WHERE id = '548e3b4e-14be-4d50-8925-5b5a11054c86';

-- Si confirmas que existe en auth.users pero NO en usuarios, ejecutar:
-- IMPORTANTE: Esto permitirá re-registrar el usuario correctamente

DELETE FROM auth.users
WHERE id = '548e3b4e-14be-4d50-8925-5b5a11054c86';

-- Verificar eliminación
SELECT id, email FROM auth.users
WHERE id = '548e3b4e-14be-4d50-8925-5b5a11054c86';
-- Debe retornar 0 filas

-- ============================================================================
-- PRÓXIMOS PASOS DESPUÉS DE EJECUTAR ESTE SCRIPT:
-- ============================================================================
-- 1. En la aplicación: Limpiar localStorage
--    - Ir a DevTools → Application → Local Storage
--    - Eliminar todos los items relacionados con Supabase
-- 
-- 2. Refrescar la página (Ctrl+F5)
--
-- 3. Intentar registrar nuevamente el usuario
--    - Email: test@waycombat.com (u otro)
--    - Verificar consola para logs detallados
--
-- 4. Verificar que ahora SÍ se cree en ambas tablas:
--    - auth.users ✅
--    - usuarios ✅
-- ============================================================================
