-- ============================================================================
-- SCRIPT COMPLETO DE POLÍTICAS RLS PARA WAYCOMBAT
-- ============================================================================
-- Fecha: 3 de octubre de 2025
-- Proyecto: WayCombat - Academia de Artes Marciales
-- Base de datos: Supabase PostgreSQL
--
-- INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Copiar y pegar este script completo
-- 3. Ejecutar (Run)
-- 4. Verificar que no haya errores
-- ============================================================================

-- ============================================================================
-- PASO 1: LIMPIAR POLÍTICAS EXISTENTES
-- ============================================================================
-- Eliminar todas las políticas antiguas para evitar conflictos

-- Políticas de tabla usuarios
DROP POLICY IF EXISTS "Usuarios pueden crear su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios pueden leer su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admins pueden leer todos los usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Admins pueden crear usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Admins pueden actualizar usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Admins pueden eliminar usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.usuarios;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.usuarios;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.usuarios;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.usuarios;

-- Políticas de tabla user_roles
DROP POLICY IF EXISTS "Usuarios pueden leer su propio rol" ON public.user_roles;
DROP POLICY IF EXISTS "Admins pueden leer todos los roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins pueden crear roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins pueden actualizar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins pueden eliminar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_roles;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.user_roles;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.user_roles;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.user_roles;

-- Políticas de tabla mixes
DROP POLICY IF EXISTS "Mixes públicos visibles para todos" ON public.mixes;
DROP POLICY IF EXISTS "Admins pueden crear mixes" ON public.mixes;
DROP POLICY IF EXISTS "Admins pueden actualizar mixes" ON public.mixes;
DROP POLICY IF EXISTS "Admins pueden eliminar mixes" ON public.mixes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.mixes;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.mixes;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.mixes;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.mixes;

-- Políticas de tabla archivo_mixes
DROP POLICY IF EXISTS "Archivos visibles según mix asociado" ON public.archivo_mixes;
DROP POLICY IF EXISTS "Admins pueden crear archivos" ON public.archivo_mixes;
DROP POLICY IF EXISTS "Admins pueden actualizar archivos" ON public.archivo_mixes;
DROP POLICY IF EXISTS "Admins pueden eliminar archivos" ON public.archivo_mixes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.archivo_mixes;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.archivo_mixes;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.archivo_mixes;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.archivo_mixes;

-- Políticas de tabla acceso_mixes
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios accesos" ON public.acceso_mixes;
DROP POLICY IF EXISTS "Admins pueden ver todos los accesos" ON public.acceso_mixes;
DROP POLICY IF EXISTS "Admins pueden crear accesos" ON public.acceso_mixes;
DROP POLICY IF EXISTS "Admins pueden actualizar accesos" ON public.acceso_mixes;
DROP POLICY IF EXISTS "Admins pueden eliminar accesos" ON public.acceso_mixes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.acceso_mixes;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.acceso_mixes;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.acceso_mixes;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.acceso_mixes;

-- ============================================================================
-- PASO 2: HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivo_mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acceso_mixes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 3: POLÍTICAS PARA TABLA "usuarios"
-- ============================================================================

-- 📝 Política 1: Usuarios pueden crear su propio perfil durante registro
CREATE POLICY "Usuarios pueden crear su propio perfil"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 📝 Política 2: Usuarios pueden leer su propio perfil
CREATE POLICY "Usuarios pueden leer su propio perfil"
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 📝 Política 3: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 📝 Política 4: Admins pueden leer todos los usuarios
CREATE POLICY "Admins pueden leer todos los usuarios"
ON public.usuarios
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 📝 Política 5: Admins pueden crear cualquier usuario
CREATE POLICY "Admins pueden crear usuarios"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 📝 Política 6: Admins pueden actualizar cualquier usuario
CREATE POLICY "Admins pueden actualizar usuarios"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 📝 Política 7: Admins pueden eliminar usuarios
CREATE POLICY "Admins pueden eliminar usuarios"
ON public.usuarios
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- PASO 4: POLÍTICAS PARA TABLA "user_roles"
-- ============================================================================

-- 📝 Política 8: Usuarios pueden leer su propio rol
CREATE POLICY "Usuarios pueden leer su propio rol"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 📝 Política 9: Admins pueden leer todos los roles
CREATE POLICY "Admins pueden leer todos los roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 📝 Política 10: Admins pueden crear roles
CREATE POLICY "Admins pueden crear roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 📝 Política 11: Admins pueden actualizar roles
CREATE POLICY "Admins pueden actualizar roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 📝 Política 12: Admins pueden eliminar roles
CREATE POLICY "Admins pueden eliminar roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- ============================================================================
-- PASO 5: POLÍTICAS PARA TABLA "mixes"
-- ============================================================================

-- 📝 Política 13: Todos pueden leer mixes (públicos y con acceso)
CREATE POLICY "Usuarios pueden leer mixes públicos o con acceso"
ON public.mixes
FOR SELECT
TO authenticated
USING (
  -- Mix es público
  es_publico = true
  OR
  -- Usuario tiene acceso explícito al mix
  EXISTS (
    SELECT 1 FROM public.acceso_mixes am
    WHERE am.mix_id = id
    AND am.usuario_id = auth.uid()
  )
  OR
  -- Usuario es admin
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 📝 Política 14: Solo admins pueden crear mixes
CREATE POLICY "Admins pueden crear mixes"
ON public.mixes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 📝 Política 15: Solo admins pueden actualizar mixes
CREATE POLICY "Admins pueden actualizar mixes"
ON public.mixes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 📝 Política 16: Solo admins pueden eliminar mixes
CREATE POLICY "Admins pueden eliminar mixes"
ON public.mixes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- PASO 6: POLÍTICAS PARA TABLA "archivo_mixes"
-- ============================================================================

-- 📝 Política 17: Usuarios pueden ver archivos según acceso al mix
CREATE POLICY "Usuarios pueden ver archivos según acceso al mix"
ON public.archivo_mixes
FOR SELECT
TO authenticated
USING (
  -- Mix asociado es público
  EXISTS (
    SELECT 1 FROM public.mixes m
    WHERE m.id = mix_id AND m.es_publico = true
  )
  OR
  -- Usuario tiene acceso al mix
  EXISTS (
    SELECT 1 FROM public.acceso_mixes am
    WHERE am.mix_id = archivo_mixes.mix_id
    AND am.usuario_id = auth.uid()
  )
  OR
  -- Usuario es admin
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 📝 Política 18: Solo admins pueden crear archivos
CREATE POLICY "Admins pueden crear archivos"
ON public.archivo_mixes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 📝 Política 19: Solo admins pueden actualizar archivos
CREATE POLICY "Admins pueden actualizar archivos"
ON public.archivo_mixes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 📝 Política 20: Solo admins pueden eliminar archivos
CREATE POLICY "Admins pueden eliminar archivos"
ON public.archivo_mixes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- PASO 7: POLÍTICAS PARA TABLA "acceso_mixes"
-- ============================================================================

-- 📝 Política 21: Usuarios pueden ver sus propios accesos
CREATE POLICY "Usuarios pueden ver sus propios accesos"
ON public.acceso_mixes
FOR SELECT
TO authenticated
USING (usuario_id = auth.uid());

-- 📝 Política 22: Admins pueden ver todos los accesos
CREATE POLICY "Admins pueden ver todos los accesos"
ON public.acceso_mixes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 📝 Política 23: Admins pueden crear accesos
CREATE POLICY "Admins pueden crear accesos"
ON public.acceso_mixes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 📝 Política 24: Admins pueden actualizar accesos
CREATE POLICY "Admins pueden actualizar accesos"
ON public.acceso_mixes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 📝 Política 25: Admins pueden eliminar accesos
CREATE POLICY "Admins pueden eliminar accesos"
ON public.acceso_mixes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- PASO 8: VERIFICACIÓN Y PERMISOS ADICIONALES
-- ============================================================================

-- Asegurar que anon puede acceder a auth (para registro/login público)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Permisos básicos para tablas (Supabase los maneja, pero por seguridad)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mixes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.archivo_mixes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acceso_mixes TO authenticated;

-- ============================================================================
-- PASO 9: CREAR FUNCIÓN HELPER PARA VERIFICAR SI ES ADMIN (OPCIONAL)
-- ============================================================================

-- Esta función puede ser útil para simplificar políticas futuras
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = $1
    AND user_roles.role = 'admin'
  );
$$;

-- Comentario explicativo
COMMENT ON FUNCTION public.is_admin IS
'Función helper para verificar si un usuario tiene rol de admin. Usar en políticas RLS.';

-- ============================================================================
-- PASO 10: VERIFICAR POLÍTICAS CREADAS
-- ============================================================================

-- Listar todas las políticas creadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- RESUMEN DE POLÍTICAS CREADAS
-- ============================================================================
--
-- ✅ TABLA usuarios: 7 políticas
--    - Usuarios pueden crear/leer/actualizar su propio perfil
--    - Admins tienen acceso completo (CRUD)
--
-- ✅ TABLA user_roles: 5 políticas
--    - Usuarios pueden leer su propio rol
--    - Admins tienen acceso completo (CRUD)
--
-- ✅ TABLA mixes: 4 políticas
--    - Usuarios pueden leer mixes públicos o con acceso
--    - Admins tienen acceso completo (CRUD)
--
-- ✅ TABLA archivo_mixes: 4 políticas
--    - Usuarios pueden ver archivos según acceso al mix
--    - Admins tienen acceso completo (CRUD)
--
-- ✅ TABLA acceso_mixes: 5 políticas
--    - Usuarios pueden ver sus propios accesos
--    - Admins tienen acceso completo (CRUD)
--
-- TOTAL: 25 políticas RLS
-- ============================================================================

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
--
-- PRÓXIMOS PASOS:
-- 1. Verificar que no haya errores en la ejecución
-- 2. Probar registro de nuevo usuario en la aplicación
-- 3. Verificar login y carga de perfil
-- 4. Probar funcionalidad de admin (crear mixes, gestionar accesos)
--
-- TROUBLESHOOTING:
-- Si aún hay problemas:
-- - Verificar que la función has_role() exista y funcione correctamente
-- - Revisar que el usuario admin tenga registro en user_roles
-- - Confirmar que auth.uid() esté disponible (usuario autenticado)
--
-- CONTACTO:
-- Para soporte adicional, revisar documentación de Supabase RLS:
-- https://supabase.com/docs/guides/auth/row-level-security
-- ============================================================================
