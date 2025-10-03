-- ================================================
-- FIX: Actualizar políticas de usuarios para permitir UPDATE de admin
-- ================================================
-- Este script actualiza las políticas RLS de usuarios
-- para que los admin puedan activar/desactivar usuarios
-- ================================================

-- 1. Verificar políticas actuales
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;

-- 2. Eliminar políticas antiguas de UPDATE si existen
DROP POLICY IF EXISTS "usuarios_update_own" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_admin" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_self" ON usuarios;

-- 3. Crear política para que usuarios puedan actualizar su propio perfil
CREATE POLICY "usuarios_update_own"
ON usuarios FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 4. Crear política para que admin pueda actualizar cualquier usuario
CREATE POLICY "usuarios_update_admin"
ON usuarios FOR UPDATE
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- 5. Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'usuarios'
  AND cmd = 'UPDATE'
ORDER BY policyname;
