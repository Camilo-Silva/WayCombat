-- ================================================
-- FIX RÁPIDO - Si hay recursión infinita
-- ================================================

-- SOLO ejecutar esto SI ves error de recursión
-- después de aplicar supabase-rls-mixs-policies.sql

-- 1. Deshabilitar temporalmente RLS en usuarios
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 2. Volver a habilitar con policies simples
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_select_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_own" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete_own" ON usuarios;

-- Policies super simples sin subconsultas
CREATE POLICY "usuarios_allow_all_select"
ON usuarios FOR SELECT TO authenticated
USING (true);  -- Permite a todos ver todos (temporal)

CREATE POLICY "usuarios_allow_own_update"
ON usuarios FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "usuarios_allow_insert"
ON usuarios FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "usuarios_allow_own_delete"
ON usuarios FOR DELETE TO authenticated
USING (id = auth.uid());

-- Verificar
SELECT policyname FROM pg_policies WHERE tablename = 'usuarios';
