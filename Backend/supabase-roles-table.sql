-- ================================================
-- WayCombat - Opción 2: Tabla de Roles Separada
-- Eliminar recursión usando tabla dedicada para roles
-- ================================================

-- VENTAJAS:
-- ✅ Elimina completamente el riesgo de recursión
-- ✅ Mejor rendimiento (índice en tabla pequeña)
-- ✅ Más escalable (fácil agregar roles nuevos)
-- ✅ Mejor separación de responsabilidades

-- DESVENTAJAS:
-- ⚠️ Requiere migración de datos existentes
-- ⚠️ Requiere actualizar código frontend/backend

-- ================================================
-- 1. CREAR TABLA user_roles
-- ================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'usuario' CHECK (role IN ('admin', 'usuario', 'instructor')),
  granted_by uuid REFERENCES auth.users(id), -- Quién otorgó el rol
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz, -- Opcional: roles temporales
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Un usuario solo puede tener un rol activo a la vez
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

-- Copiar roles existentes de la tabla usuarios a user_roles
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
  COUNT(*) as total_usuarios,
  COUNT(DISTINCT user_id) as usuarios_con_roles
FROM user_roles;

-- ================================================
-- 3. CREAR FUNCIÓN HELPER para verificar roles
-- ================================================

-- Función optimizada que NO causa recursión
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

-- Función para obtener el rol actual del usuario
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

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

-- ================================================
-- 4. RLS POLICIES PARA user_roles
-- ================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Usuarios pueden ver sus propios roles
CREATE POLICY "user_roles_select_own"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Admins pueden ver todos los roles
CREATE POLICY "user_roles_select_admin"
ON user_roles FOR SELECT
TO authenticated
USING (public.has_role('admin'));

-- Policy 3: Solo admins pueden insertar roles
CREATE POLICY "user_roles_insert_admin"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'));

-- Policy 4: Solo admins pueden actualizar roles
CREATE POLICY "user_roles_update_admin"
ON user_roles FOR UPDATE
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- Policy 5: Solo admins pueden eliminar roles
CREATE POLICY "user_roles_delete_admin"
ON user_roles FOR DELETE
TO authenticated
USING (public.has_role('admin'));

-- ================================================
-- 5. ACTUALIZAR POLICIES DE usuarios
-- ================================================

-- Ahora podemos hacer policies más restrictivas sin recursión

DROP POLICY IF EXISTS "usuarios_insert_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_admin_only" ON usuarios;

-- Solo admins pueden insertar usuarios
CREATE POLICY "usuarios_insert_admin_only"
ON usuarios FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'));

-- Solo admins pueden ver todos los usuarios
DROP POLICY IF EXISTS "usuarios_select_all" ON usuarios;

CREATE POLICY "usuarios_select_own_or_admin"
ON usuarios FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR public.has_role('admin')
);

-- ================================================
-- 6. ACTUALIZAR POLICIES DE mixes (OPCIONAL - MEJOR RENDIMIENTO)
-- ================================================

-- Ahora las policies de mixes pueden usar has_role() en lugar de subconsultas

DROP POLICY IF EXISTS "mixes_select_user_or_admin" ON mixes;

CREATE POLICY "mixes_select_user_or_admin"
ON mixes FOR SELECT
TO authenticated
USING (
  -- Admins ven todo
  public.has_role('admin')
  OR
  -- Usuarios ven solo mixs con permiso activo
  EXISTS (
    SELECT 1 FROM acceso_mixes
    WHERE mix_id = mixes.id
      AND usuario_id = auth.uid()
      AND activo = true
  )
);

-- ================================================
-- 7. FUNCIÓN DE REGISTRO AUTOMÁTICO (OPCIONAL)
-- ================================================

-- Trigger para crear rol 'usuario' por defecto al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Crear rol 'usuario' por defecto para nuevos usuarios
  INSERT INTO public.user_roles (user_id, role, active)
  VALUES (NEW.id, 'usuario', true);
  
  RETURN NEW;
END;
$$;

-- Trigger que se ejecuta después de INSERT en auth.users
-- NOTA: Esto solo funciona si tienes acceso al schema auth
-- Si no, deberás crear roles manualmente al registrar usuarios
/*
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/

-- ================================================
-- 8. VERIFICACIÓN FINAL
-- ================================================

-- Ver todas las funciones creadas
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('has_role', 'get_current_user_role', 'handle_new_user');

-- Ver policies de user_roles
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Ver policies actualizadas de usuarios
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'usuarios'
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

-- Prueba 4: (Solo admin) Ver todos los roles
SELECT 
  u.email,
  u.nombre,
  u.apellido,
  ur.role,
  ur.active,
  ur.granted_at
FROM usuarios u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY ur.granted_at DESC;

-- ================================================
-- 10. ROLLBACK (si algo sale mal)
-- ================================================

/*
-- Para revertir todos los cambios:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.has_role(text);
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Restaurar policy antigua
CREATE POLICY "usuarios_insert_all"
ON usuarios FOR INSERT TO authenticated
WITH CHECK (true);
*/
