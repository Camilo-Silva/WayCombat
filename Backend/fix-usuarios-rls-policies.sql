-- ============================================================================
-- FIX: POLÍTICAS RLS PARA TABLA "usuarios"
-- ============================================================================
-- Problema: usuarios_insert_admin_only impide auto-registro
-- Solución: Permitir INSERT propio + INSERT de admin
-- ============================================================================

-- PASO 1: Modificar política existente usuarios_insert_admin_only
-- En lugar de eliminar y crear nueva, actualizamos la existente
-- Esto mantiene el nombre y solo cambia la lógica

-- Eliminar la política restrictiva actual
DROP POLICY IF EXISTS "usuarios_insert_admin_only" ON public.usuarios;

-- PASO 2: Crear política mejorada con el mismo concepto pero dual
-- Esta política permite:
-- 1. Que un usuario cree su propio perfil durante registro (auth.uid() = id)
-- 2. Que un admin cree usuarios para otros (has_role('admin'))

CREATE POLICY "usuarios_insert_admin_only"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  -- Caso 1: Usuario creando su propio perfil (auto-registro)
  -- Esto permite que durante el registro, el usuario inserte su propio registro
  auth.uid() = id
  OR
  -- Caso 2: Admin creando usuario para otra persona
  -- Usa la misma función has_role() que ya existe en tu proyecto
  has_role('admin'::text)
);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Listar todas las políticas actuales de usuarios
SELECT 
  policyname,
  cmd as operacion,
  qual as condicion_using,
  with_check as condicion_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'usuarios'
ORDER BY cmd, policyname;

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================
-- 
-- ✅ ACTUALIZADA: usuarios_insert_admin_only
--    ANTES: Solo has_role('admin') → Bloqueaba auto-registro
--    AHORA: auth.uid() = id OR has_role('admin') → Permite auto-registro
--
-- NUEVA LÓGICA:
--    - Permite auto-registro: auth.uid() = id
--    - Permite admin crear usuarios: has_role('admin')
--
-- POLÍTICAS FINALES DE INSERT EN usuarios:
-- 1. usuarios_insert_admin_only ← ACTUALIZADA (mismo nombre, nueva lógica)
--
-- POLÍTICAS QUE SE MANTIENEN SIN CAMBIOS:
-- - usuarios_delete_own (DELETE)
-- - usuarios_select_own (SELECT)
-- - usuarios_select_own_or_admin (SELECT)
-- - usuarios_update_admin (UPDATE)
-- - usuarios_update_all (UPDATE)
-- - usuarios_update_own (UPDATE)
--
-- ============================================================================

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Política "usuarios_insert_admin_only" actualizada correctamente';
  RAISE NOTICE '📝 Ahora permite: auth.uid() = id OR has_role(''admin'')';
  RAISE NOTICE '🎯 Usuarios pueden auto-registrarse';
  RAISE NOTICE '🔐 Admins pueden crear usuarios manualmente';
END $$;
