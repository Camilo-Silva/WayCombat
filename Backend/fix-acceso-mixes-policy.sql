-- ================================================
-- FIX: Actualizar políticas de acceso_mixes para usar has_role()
-- ================================================
-- Este script actualiza las políticas RLS de acceso_mixes
-- para usar la función has_role() en lugar de la columna rol
-- ================================================

-- 1. Eliminar políticas antiguas
DROP POLICY IF EXISTS "acceso_mixes_select_own" ON acceso_mixes;
DROP POLICY IF EXISTS "acceso_mixes_select_admin" ON acceso_mixes;
DROP POLICY IF EXISTS "acceso_mixes_insert_admin" ON acceso_mixes;
DROP POLICY IF EXISTS "acceso_mixes_update_admin" ON acceso_mixes;
DROP POLICY IF EXISTS "acceso_mixes_delete_admin" ON acceso_mixes;

-- 2. Crear nuevas políticas usando has_role()

-- Policy SELECT: Usuarios ven sus propios permisos, admins ven todos
CREATE POLICY "acceso_mixes_select_user_or_admin"
ON acceso_mixes FOR SELECT
TO authenticated
USING (
  -- Usuario ve solo sus propios permisos
  usuario_id = auth.uid()
  OR
  -- Admin ve todos los permisos
  public.has_role('admin')
);

-- Policy INSERT: Solo admins pueden crear permisos
CREATE POLICY "acceso_mixes_insert_admin"
ON acceso_mixes FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'));

-- Policy UPDATE: Solo admins pueden actualizar permisos
CREATE POLICY "acceso_mixes_update_admin"
ON acceso_mixes FOR UPDATE
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- Policy DELETE: Solo admins pueden eliminar permisos
CREATE POLICY "acceso_mixes_delete_admin"
ON acceso_mixes FOR DELETE
TO authenticated
USING (public.has_role('admin'));

-- ================================================
-- 3. Verificar políticas actualizadas
-- ================================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'acceso_mixes'
ORDER BY policyname;
