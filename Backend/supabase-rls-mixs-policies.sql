-- ================================================
-- WayCombat - Supabase RLS Policies para Mixs
-- Control de acceso basado en permisos
-- ================================================

-- IMPORTANTE: Ejecutar estas queries en el SQL Editor de Supabase
-- Dashboard → SQL Editor → New Query → Copiar y pegar este contenido

-- ================================================
-- 1. HABILITAR RLS EN TODAS LAS TABLAS
-- ================================================

ALTER TABLE mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceso_mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE archivo_mixes ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 2. ELIMINAR POLICIES EXISTENTES (SI LAS HAY)
-- ================================================

-- Mixes
DROP POLICY IF EXISTS "mixes_select_own" ON mixes;
DROP POLICY IF EXISTS "mixes_select_admin" ON mixes;
DROP POLICY IF EXISTS "mixes_insert_admin" ON mixes;
DROP POLICY IF EXISTS "mixes_update_admin" ON mixes;
DROP POLICY IF EXISTS "mixes_delete_admin" ON mixes;

-- Acceso Mixes
DROP POLICY IF EXISTS "acceso_mixes_select_own" ON acceso_mixes;
DROP POLICY IF EXISTS "acceso_mixes_select_admin" ON acceso_mixes;
DROP POLICY IF EXISTS "acceso_mixes_insert_admin" ON acceso_mixes;
DROP POLICY IF EXISTS "acceso_mixes_update_admin" ON acceso_mixes;
DROP POLICY IF EXISTS "acceso_mixes_delete_admin" ON acceso_mixes;

-- Archivo Mixes
DROP POLICY IF EXISTS "archivo_mixes_select_own" ON archivo_mixes;
DROP POLICY IF EXISTS "archivo_mixes_select_admin" ON archivo_mixes;
DROP POLICY IF EXISTS "archivo_mixes_insert_admin" ON archivo_mixes;
DROP POLICY IF EXISTS "archivo_mixes_update_admin" ON archivo_mixes;
DROP POLICY IF EXISTS "archivo_mixes_delete_admin" ON archivo_mixes;

-- ================================================
-- 3. POLÍTICAS PARA TABLA MIXES
-- ================================================

-- Policy 1: Usuarios pueden ver SOLO mixs con permiso activo
CREATE POLICY "mixes_select_with_permission"
ON mixes
FOR SELECT
TO authenticated
USING (
  -- El usuario tiene un permiso activo para este mix
  EXISTS (
    SELECT 1 
    FROM acceso_mixes 
    WHERE acceso_mixes.mix_id = mixes.id 
    AND acceso_mixes.usuario_id = auth.uid()
    AND acceso_mixes.activo = true
  )
);

-- Policy 2: Admins pueden ver TODOS los mixs
-- NOTA: Esto es temporal, idealmente usarías una tabla de roles separada
CREATE POLICY "mixes_select_all_admin"
ON mixes
FOR SELECT
TO authenticated
USING (
  -- Verificar si es admin consultando directamente el rol
  -- En producción, usa una de las 3 opciones del SUPABASE-SECURITY-TODO.md
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- Policy 3: Solo admins pueden crear mixs
CREATE POLICY "mixes_insert_admin"
ON mixes
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- Policy 4: Solo admins pueden actualizar mixs
CREATE POLICY "mixes_update_admin"
ON mixes
FOR UPDATE
TO authenticated
USING (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- Policy 5: Solo admins pueden eliminar mixs
CREATE POLICY "mixes_delete_admin"
ON mixes
FOR DELETE
TO authenticated
USING (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- ================================================
-- 4. POLÍTICAS PARA TABLA ACCESO_MIXES
-- ================================================

-- Policy 1: Usuarios pueden ver SOLO sus propios permisos
CREATE POLICY "acceso_mixes_select_own"
ON acceso_mixes
FOR SELECT
TO authenticated
USING (
  usuario_id = auth.uid()
);

-- Policy 2: Admins pueden ver TODOS los permisos
CREATE POLICY "acceso_mixes_select_admin"
ON acceso_mixes
FOR SELECT
TO authenticated
USING (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- Policy 3: Solo admins pueden crear permisos
CREATE POLICY "acceso_mixes_insert_admin"
ON acceso_mixes
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- Policy 4: Solo admins pueden actualizar permisos
CREATE POLICY "acceso_mixes_update_admin"
ON acceso_mixes
FOR UPDATE
TO authenticated
USING (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- Policy 5: Solo admins pueden eliminar permisos
CREATE POLICY "acceso_mixes_delete_admin"
ON acceso_mixes
FOR DELETE
TO authenticated
USING (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- ================================================
-- 5. POLÍTICAS PARA TABLA ARCHIVO_MIXES
-- ================================================

-- Policy 1: Usuarios pueden ver archivos de mixs con permiso
CREATE POLICY "archivo_mixes_select_with_permission"
ON archivo_mixes
FOR SELECT
TO authenticated
USING (
  -- Verificar que el usuario tiene permiso para el mix padre
  EXISTS (
    SELECT 1 
    FROM acceso_mixes 
    WHERE acceso_mixes.mix_id = archivo_mixes.mix_id 
    AND acceso_mixes.usuario_id = auth.uid()
    AND acceso_mixes.activo = true
  )
);

-- Policy 2: Admins pueden ver TODOS los archivos
CREATE POLICY "archivo_mixes_select_admin"
ON archivo_mixes
FOR SELECT
TO authenticated
USING (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- Policy 3: Solo admins pueden crear archivos
CREATE POLICY "archivo_mixes_insert_admin"
ON archivo_mixes
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- Policy 4: Solo admins pueden actualizar archivos
CREATE POLICY "archivo_mixes_update_admin"
ON archivo_mixes
FOR UPDATE
TO authenticated
USING (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- Policy 5: Solo admins pueden eliminar archivos
CREATE POLICY "archivo_mixes_delete_admin"
ON archivo_mixes
FOR DELETE
TO authenticated
USING (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- ================================================
-- 6. VERIFICACIÓN DE POLICIES
-- ================================================

-- Ver todas las policies de mixes
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('mixes', 'acceso_mixes', 'archivo_mixes')
ORDER BY tablename, policyname;

-- ================================================
-- 7. PRUEBAS BÁSICAS
-- ================================================

-- Prueba 1: Ver mis mixs (debería retornar solo mixs con permiso)
SELECT 
  m.id,
  m.titulo,
  m.descripcion,
  am.activo as "tengo_permiso"
FROM mixes m
LEFT JOIN acceso_mixes am ON am.mix_id = m.id AND am.usuario_id = auth.uid()
WHERE am.activo = true OR (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin';

-- Prueba 2: Ver mis permisos
SELECT 
  am.id,
  m.titulo as "mix_nombre",
  am.activo
FROM acceso_mixes am
JOIN mixes m ON m.id = am.mix_id
WHERE am.usuario_id = auth.uid();

-- Prueba 3: (Solo para admins) Ver todos los permisos
SELECT 
  u.nombre as "usuario",
  m.titulo as "mix",
  am.activo
FROM acceso_mixes am
JOIN usuarios u ON u.id = am.usuario_id
JOIN mixes m ON m.id = am.mix_id
ORDER BY u.nombre, m.titulo;

-- ================================================
-- NOTAS IMPORTANTES
-- ================================================

-- ⚠️ ADVERTENCIA: Estas policies usan subconsultas a la tabla usuarios
-- Esto PUEDE causar recursión si tienes policies complejas en usuarios
-- 
-- Si experimentas recursión infinita, implementa una de estas soluciones:
-- 
-- SOLUCIÓN 1: Tabla separada de roles (RECOMENDADO)
-- CREATE TABLE user_roles (
--   user_id UUID PRIMARY KEY,
--   role TEXT NOT NULL
-- );
-- 
-- Luego usa:
-- (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
-- 
-- SOLUCIÓN 2: JWT Custom Claims
-- Configura Supabase para incluir el rol en el JWT
-- Luego usa:
-- (auth.jwt() ->> 'role')::text = 'admin'
--
-- SOLUCIÓN 3: Edge Function
-- Crea una función serverless que valide roles
-- y llámala desde el frontend

-- ✅ Funcionalidades implementadas:
--    - Usuarios ven solo mixs con permiso activo
--    - Admins ven y gestionan todos los mixs
--    - Control granular de permisos por usuario/mix
--    - Archivos protegidos según permisos del mix padre

-- 📋 Checklist de testing:
-- [ ] Usuario normal NO ve mixs sin permiso
-- [ ] Usuario normal VE mixs con permiso activo
-- [ ] Usuario normal NO ve mixs con permiso inactivo
-- [ ] Admin ve TODOS los mixs
-- [ ] Admin puede crear/editar/eliminar mixs
-- [ ] Admin puede otorgar/revocar permisos
-- [ ] Usuario normal NO puede modificar permisos
