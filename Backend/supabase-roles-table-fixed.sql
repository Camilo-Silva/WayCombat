-- ================================================
-- WayCombat - Tabla de Roles Separada (CORREGIDO)
-- Fix: Normalizar roles a minúsculas antes de migrar
-- ================================================

-- ================================================
-- PASO 0: NORMALIZAR ROLES EN TABLA usuarios (IMPORTANTE)
-- ================================================

-- Convertir todos los roles a minúsculas para consistencia
UPDATE usuarios
SET rol = LOWER(rol)
WHERE rol IS NOT NULL;

-- Verificar normalización
SELECT DISTINCT rol, COUNT(*) as cantidad
FROM usuarios
GROUP BY rol
ORDER BY rol;

-- ================================================
-- 1. CREAR TABLA user_roles
-- ================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
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

-- Comentarios para documentación
COMMENT ON TABLE user_roles IS 'Roles de usuarios del sistema WayCombat';
COMMENT ON COLUMN user_roles.role IS 'Tipo de rol: admin, usuario, instructor';
COMMENT ON COLUMN user_roles.granted_by IS 'UUID del usuario que otorgó este rol';

-- ================================================
-- 2. MIGRAR DATOS EXISTENTES DE usuarios
-- ================================================

-- Copiar roles existentes (ahora normalizados) de usuarios a user_roles
INSERT INTO user_roles (user_id, role, active, granted_at)
SELECT 
  id AS user_id,
  LOWER(rol) AS role, -- Asegurar minúsculas
  activo AS active,
  fecha_creacion AS granted_at
FROM usuarios
WHERE rol IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar migración
SELECT 
  COUNT(*) as total_roles,
  COUNT(DISTINCT user_id) as usuarios_con_roles
FROM user_roles;

-- Ver roles migrados por tipo
SELECT role, COUNT(*) as cantidad
FROM user_roles
WHERE active = true
GROUP BY role
ORDER BY role;

-- ================================================
-- 3. CREAR FUNCIÓN HELPER para verificar roles
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
-- 4. RLS POLICIES PARA user_roles
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
-- 5. ACTUALIZAR POLICIES DE usuarios
-- ================================================

DROP POLICY IF EXISTS "usuarios_insert_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_admin_only" ON usuarios;

CREATE POLICY "usuarios_insert_admin_only"
ON usuarios FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "usuarios_select_all" ON usuarios;

CREATE POLICY "usuarios_select_own_or_admin"
ON usuarios FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR public.has_role('admin')
);

-- ================================================
-- 6. ACTUALIZAR POLICIES DE mixes
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
-- 7. FUNCIÓN DE REGISTRO AUTOMÁTICO
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
-- 8. VERIFICACIÓN FINAL
-- ================================================

-- Ver funciones creadas
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('has_role', 'get_current_user_role', 'handle_new_user');

-- Ver policies de user_roles
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Ver policies de usuarios
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;

-- Ver policies de mixes
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'mixes'
ORDER BY policyname;

-- ================================================
-- 9. PRUEBAS
-- ================================================

-- Prueba 1: Ver mi rol actual
SELECT public.get_current_user_role();

-- Prueba 2: Verificar si soy admin
SELECT public.has_role('admin');

-- Prueba 3: Ver mis roles
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- Prueba 4: Ver todos los usuarios con sus roles (solo admin)
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
-- 10. ROLLBACK (si algo sale mal)
-- ================================================

/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.has_role(text);
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Restaurar policies antiguas
CREATE POLICY "usuarios_select_all" ON usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "usuarios_insert_all" ON usuarios FOR INSERT TO authenticated WITH CHECK (true);
*/
