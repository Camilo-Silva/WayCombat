-- ================================================
-- WayCombat - Fix para usuarios_insert_all
-- Restringir INSERT solo a admins SIN causar recursión
-- ================================================

-- OPCIÓN 1: Usar función PostgreSQL (RECOMENDADO)
-- ================================================

-- 1. Crear función que verifica si el usuario actual es admin
-- Esta función NO causa recursión porque usa auth.uid() directamente
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con permisos del dueño de la función
STABLE -- Puede cachear el resultado durante la transacción
AS $$
BEGIN
  -- Verificar si existe un usuario con rol 'admin' para el auth.uid() actual
  RETURN EXISTS (
    SELECT 1 
    FROM public.usuarios 
    WHERE id = auth.uid() 
      AND rol = 'admin'
      AND activo = true
    LIMIT 1
  );
END;
$$;

-- 2. Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Eliminar policy antigua
DROP POLICY IF EXISTS "usuarios_insert_all" ON usuarios;

-- 4. Crear nueva policy que solo permite a admins insertar usuarios
CREATE POLICY "usuarios_insert_admin_only"
ON usuarios
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin()); -- Solo admins pueden insertar

-- ================================================
-- OPCIÓN 2: Permitir auto-registro + admin (ALTERNATIVA)
-- ================================================

-- Si quieres permitir que usuarios se registren a sí mismos
-- pero solo admin puede crear usuarios con rol 'admin':

/*
DROP POLICY IF EXISTS "usuarios_insert_admin_only" ON usuarios;

CREATE POLICY "usuarios_insert_self_or_admin"
ON usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  -- Permitir si:
  -- 1. El usuario se está registrando a sí mismo (id = auth.uid())
  auth.uid() = id
  OR
  -- 2. O si el usuario actual es admin (puede crear cualquier usuario)
  public.is_admin()
);
*/

-- ================================================
-- VERIFICACIÓN
-- ================================================

-- Verificar que la función existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'is_admin';

-- Verificar policies de usuarios
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;

-- ================================================
-- PRUEBAS
-- ================================================

-- Prueba 1: Verificar si el usuario actual es admin
SELECT public.is_admin();

-- Prueba 2: Intentar insertar usuario (solo debería funcionar si eres admin)
-- NOTA: Esto fallará si no eres admin
/*
INSERT INTO usuarios (id, email, nombre, apellido, rol, activo)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test@test.com',
  'Test',
  'User',
  'usuario',
  true
);
*/
