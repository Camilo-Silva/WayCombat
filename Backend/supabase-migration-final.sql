-- ================================================
-- WayCombat - FIX COMPLETO: Constraints y Migración
-- Solución: Actualizar constraint de usuarios ANTES de normalizar
-- ================================================

-- ================================================
-- PASO 0: ELIMINAR/ACTUALIZAR CONSTRAINT DE usuarios.rol
-- ================================================

-- Ver el constraint actual
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'usuarios' 
  AND con.conname LIKE '%rol%';

-- Eliminar el constraint antiguo que causa problemas
ALTER TABLE usuarios 
DROP CONSTRAINT IF EXISTS usuarios_rol_check;

-- Crear nuevo constraint que acepta minúsculas
ALTER TABLE usuarios
ADD CONSTRAINT usuarios_rol_check 
CHECK (rol IN ('admin', 'usuario', 'instructor'));

-- Ahora sí, normalizar todos los roles a minúsculas
UPDATE usuarios
SET rol = LOWER(rol)
WHERE rol IS NOT NULL;

-- Verificar normalización
SELECT DISTINCT rol, COUNT(*) as cantidad
FROM usuarios
GROUP BY rol
ORDER BY rol;

-- ================================================
-- 1. LIMPIAR INTENTOS ANTERIORES (POR SI ACASO)
-- ================================================

DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP FUNCTION IF EXISTS public.has_role(text);
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ================================================
-- 2. CREAR TABLA user_roles
-- ================================================

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'usuario' CHECK (role IN ('admin', 'usuario', 'instructor')),
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, role)
);

-- Índices para rendimiento
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_active ON user_roles(active) WHERE active = true;

-- Comentarios
COMMENT ON TABLE user_roles IS 'Roles de usuarios del sistema WayCombat';
COMMENT ON COLUMN user_roles.role IS 'Tipo de rol: admin, usuario, instructor';

-- ================================================
-- 3. MIGRAR DATOS EXISTENTES
-- ================================================

INSERT INTO user_roles (user_id, role, active, granted_at)
SELECT 
  id AS user_id,
  rol AS role,
  activo AS active,
  fecha_creacion AS granted_at
FROM usuarios
WHERE rol IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar migración
SELECT 
  'Total roles migrados:' as descripcion,
  COUNT(*) as cantidad
FROM user_roles
UNION ALL
SELECT 
  'Usuarios únicos:' as descripcion,
  COUNT(DISTINCT user_id) as cantidad
FROM user_roles;

-- Ver distribución de roles
SELECT role, COUNT(*) as cantidad
FROM user_roles
WHERE active = true
GROUP BY role
ORDER BY role;

-- ================================================
-- 4. CREAR FUNCIONES HELPER
-- ================================================

CREATE OR REPLACE FUNCTION public.has_role(role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = role_name
      AND active = true
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
    AND active = true
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'instructor' THEN 2 
      ELSE 3 
    END
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

-- ================================================
-- 5. RLS POLICIES PARA user_roles
-- ================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_own"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_roles_select_admin"
ON user_roles FOR SELECT
TO authenticated
USING (public.has_role('admin'));

CREATE POLICY "user_roles_insert_admin"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'));

CREATE POLICY "user_roles_update_admin"
ON user_roles FOR UPDATE
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

CREATE POLICY "user_roles_delete_admin"
ON user_roles FOR DELETE
TO authenticated
USING (public.has_role('admin'));

-- ================================================
-- 6. ACTUALIZAR POLICIES DE usuarios
-- ================================================

DROP POLICY IF EXISTS "usuarios_insert_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_admin_only" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_own_or_admin" ON usuarios;

-- Solo admins pueden insertar usuarios
CREATE POLICY "usuarios_insert_admin_only"
ON usuarios FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'));

-- Solo puedes ver tu info o eres admin
CREATE POLICY "usuarios_select_own_or_admin"
ON usuarios FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR public.has_role('admin')
);

-- ================================================
-- 7. ACTUALIZAR POLICIES DE mixes
-- ================================================

DROP POLICY IF EXISTS "mixes_select_user_or_admin" ON mixes;

CREATE POLICY "mixes_select_user_or_admin"
ON mixes FOR SELECT
TO authenticated
USING (
  public.has_role('admin')
  OR
  EXISTS (
    SELECT 1 FROM acceso_mixes
    WHERE mix_id = mixes.id
      AND usuario_id = auth.uid()
      AND activo = true
  )
);

DROP POLICY IF EXISTS "mixes_insert_admin" ON mixes;

CREATE POLICY "mixes_insert_admin"
ON mixes FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "mixes_update_admin" ON mixes;

CREATE POLICY "mixes_update_admin"
ON mixes FOR UPDATE
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "mixes_delete_admin" ON mixes;

CREATE POLICY "mixes_delete_admin"
ON mixes FOR DELETE
TO authenticated
USING (public.has_role('admin'));

-- ================================================
-- 8. FUNCIÓN DE REGISTRO AUTOMÁTICO
-- ================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, active)
  VALUES (NEW.id, 'usuario', true);
  
  RETURN NEW;
END;
$$;

-- ================================================
-- 9. VERIFICACIÓN FINAL
-- ================================================

-- Ver funciones creadas
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('has_role', 'get_current_user_role', 'handle_new_user');

-- Ver policies de user_roles
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Ver policies de usuarios
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;

-- Ver policies de mixes
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'mixes'
ORDER BY policyname;

-- ================================================
-- 10. PRUEBAS FINALES
-- ================================================

-- Prueba 1: Ver mi rol actual
SELECT 'Mi rol:' as test, public.get_current_user_role() as resultado;

-- Prueba 2: ¿Soy admin?
SELECT '¿Soy admin?:' as test, public.has_role('admin') as resultado;

-- Prueba 3: Ver mis roles en user_roles
SELECT 'Mis roles en user_roles:' as test;
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- Prueba 4: Ver mi usuario en tabla usuarios
SELECT 'Mi usuario:' as test;
SELECT id, email, nombre, apellido, rol, activo FROM usuarios WHERE id = auth.uid();

-- Prueba 5: (Solo admin) Ver todos los usuarios con roles
SELECT 'Todos los usuarios con roles:' as test;
SELECT 
  u.email,
  u.nombre,
  u.apellido,
  ur.role,
  ur.active,
  ur.granted_at
FROM usuarios u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.active = true
ORDER BY ur.granted_at DESC;

-- ================================================
-- ✅ MIGRACIÓN COMPLETADA
-- ================================================

-- Si llegaste hasta aquí sin errores, la migración fue exitosa!
SELECT '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE' as status;
