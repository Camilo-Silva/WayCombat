-- ============================================================================
-- LIMPIEZA DE USUARIOS DE PRUEBA
-- ============================================================================
-- Este script elimina usuarios tanto de auth.users como de public.usuarios
-- Útil para limpiar usuarios de prueba que causan conflictos
-- ============================================================================

-- ⚠️ IMPORTANTE: Reemplaza el email con el usuario que quieres eliminar

-- PASO 1: Eliminar de la tabla public.usuarios
DELETE FROM public.usuarios
WHERE email = 'tu-email@test.com'; -- ⬅️ CAMBIAR POR TU EMAIL

-- PASO 2: Eliminar de auth.users (requiere permisos de administrador)
DELETE FROM auth.users
WHERE email = 'tu-email@test.com'; -- ⬅️ CAMBIAR POR TU EMAIL

-- PASO 3: Verificar eliminación
SELECT 'Usuarios restantes en public.usuarios:' as info;
SELECT id, codigo, nombre, email, rol
FROM public.usuarios
ORDER BY fecha_creacion DESC
LIMIT 10;

SELECT 'Usuarios restantes en auth.users:' as info;
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- LIMPIEZA MASIVA (OPCIONAL - USAR CON PRECAUCIÓN)
-- ============================================================================
-- Si quieres eliminar TODOS los usuarios de prueba excepto admin:

/*
-- Eliminar de public.usuarios (excepto admin)
DELETE FROM public.usuarios
WHERE email != 'admin@waycombat.com';

-- Eliminar de auth.users (excepto admin)
DELETE FROM auth.users
WHERE email != 'admin@waycombat.com';
*/

-- ============================================================================
-- RESETEAR SECUENCIA DE CÓDIGOS (OPCIONAL)
-- ============================================================================
-- Si quieres que los códigos vuelvan a empezar desde USR-001:

/*
-- Solo si eliminaste TODOS los usuarios y quieres empezar de cero
-- Esto NO afecta a la función, solo es informativo
SELECT 'Nota: La función generate_user_code() calculará automáticamente' as info,
       'el siguiente número basándose en los códigos existentes.' as detalle;
*/
