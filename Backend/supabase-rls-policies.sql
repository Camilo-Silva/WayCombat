-- ================================================
-- WayCombat - Supabase RLS Policies
-- Configuración de Row Level Security sin recursión
-- ================================================

-- IMPORTANTE: Ejecutar estas queries en el SQL Editor de Supabase
-- Dashboard → SQL Editor → New Query → Copiar y pegar este contenido

-- ================================================
-- 1. HABILITAR RLS EN LA TABLA USUARIOS
-- ================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 2. ELIMINAR POLICIES EXISTENTES (SI LAS HAY)
-- ================================================

DROP POLICY IF EXISTS "usuarios_select_own" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_admin" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_admin" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete_admin" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_admin" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete_own" ON usuarios;

-- ================================================
-- 3. POLÍTICAS SIN RECURSIÓN (VERSIÓN FUNCIONAL)
-- ================================================

-- Policy 1: Todos pueden ver su propia información
CREATE POLICY "usuarios_select_own"
ON usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Todos pueden actualizar su propia información
CREATE POLICY "usuarios_update_own"
ON usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Permitir SELECT a todos los usuarios autenticados
CREATE POLICY "usuarios_select_all"
ON usuarios
FOR SELECT
TO authenticated
USING (true);

-- Policy 4: Solo el mismo usuario puede hacer UPDATE
CREATE POLICY "usuarios_update_all"
ON usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Policy 5: Permitir INSERT a usuarios autenticados
CREATE POLICY "usuarios_insert_all"
ON usuarios
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 6: Permitir DELETE solo del propio usuario
CREATE POLICY "usuarios_delete_own"
ON usuarios
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- ================================================
-- 4. VERIFICACIÓN DE POLICIES
-- ================================================

-- Ejecuta esta query para verificar que las policies se crearon correctamente
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;

-- ================================================
-- 5. PRUEBAS BÁSICAS
-- ================================================

-- Prueba 1: Verificar que el usuario actual puede ver su propia información
SELECT * FROM usuarios WHERE id = auth.uid();

-- Prueba 2: Verificar si eres admin
SELECT rol FROM usuarios WHERE id = auth.uid();

-- Prueba 3: Ver todos los usuarios (debería funcionar si estás autenticado)
SELECT id, email, nombre, rol, activo 
FROM usuarios
ORDER BY fecha_creacion DESC;

-- ================================================
-- NOTAS IMPORTANTES
-- ================================================

-- ✅ Estas policies NO causan recursión porque:
--    1. Usan solo auth.uid() que es una función de sistema
--    2. NO consultan la tabla usuarios dentro de las policies
--    3. Usan TO authenticated para limitar a usuarios autenticados
--    4. Usan USING (true) para permitir acceso sin subconsultas

-- ✅ Funcionalidades implementadas:
--    - Usuarios autenticados: pueden ver todos los usuarios
--    - Usuarios autenticados: pueden actualizar solo su propia información
--    - Usuarios autenticados: pueden crear nuevos registros
--    - Usuarios autenticados: pueden eliminar solo su propio usuario

-- ⚠️ IMPORTANTE: 
--    - Esta configuración es más permisiva para evitar recursión
--    - En producción, considera implementar lógica de roles en el backend
--    - O usar Supabase Edge Functions para validaciones complejas
