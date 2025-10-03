-- ================================================
-- WayCombat - MIGRACIÓN SEGURA con Limpieza Automática
-- Solución: Limpiar y normalizar TODOS los valores antes de aplicar constraints
-- ================================================

-- ================================================
-- PASO 1: VER QUÉ TENEMOS (DIAGNÓSTICO)
-- ================================================

SELECT '=== DIAGNÓSTICO: Valores actuales de rol ===' as info;

SELECT 
  COALESCE(rol, '(NULL)') as rol_actual,
  COUNT(*) as cantidad
FROM usuarios
GROUP BY rol
ORDER BY cantidad DESC;

-- ================================================
-- PASO 2: LIMPIAR Y NORMALIZAR DATOS
-- ================================================

-- Eliminar constraint antiguo si existe
ALTER TABLE usuarios 
DROP CONSTRAINT IF EXISTS usuarios_rol_check;

-- Normalizar roles conocidos a minúsculas
UPDATE usuarios
SET rol = CASE 
  WHEN LOWER(rol) = 'admin' THEN 'admin'
  WHEN LOWER(rol) = 'usuario' THEN 'usuario'
  WHEN LOWER(rol) = 'instructor' THEN 'instructor'
  ELSE 'usuario'  -- Cualquier valor no reconocido se convierte en 'usuario'
END
WHERE rol IS NOT NULL;

-- Asignar 'usuario' por defecto a registros con NULL
UPDATE usuarios
SET rol = 'usuario'
WHERE rol IS NULL;

-- Verificar limpieza
SELECT '=== DESPUÉS DE LIMPIEZA ===' as info;

SELECT 
  rol,
  COUNT(*) as cantidad
FROM usuarios
GROUP BY rol
ORDER BY rol;

-- ================================================
-- PASO 3: APLICAR CONSTRAINT (Ahora sí debería funcionar)
-- ================================================

ALTER TABLE usuarios
ADD CONSTRAINT usuarios_rol_check 
CHECK (rol IN ('admin', 'usuario', 'instructor'));

SELECT '✅ Constraint aplicado correctamente' as status;

-- ================================================
-- PASO 4: LIMPIAR INTENTOS ANTERIORES DE MIGRACIÓN
-- ================================================

DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP FUNCTION IF EXISTS public.has_role(text);
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ================================================
-- PASO 5: CREAR TABLA user_roles
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

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_active ON user_roles(active) WHERE active = true;

COMMENT ON TABLE user_roles IS 'Roles de usuarios del sistema WayCombat';

SELECT '✅ Tabla user_roles creada' as status;

-- ================================================
-- PASO 6: MIGRAR DATOS
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
SELECT '=== MIGRACIÓN COMPLETADA ===' as info;

SELECT 
  'Total roles migrados' as descripcion,
  COUNT(*) as cantidad
FROM user_roles
UNION ALL
SELECT 
  'Usuarios únicos' as descripcion,
  COUNT(DISTINCT user_id) as cantidad
FROM user_roles;

-- Ver distribución
SELECT '=== DISTRIBUCIÓN DE ROLES ===' as info;

SELECT role, COUNT(*) as cantidad
FROM user_roles
WHERE active = true
GROUP BY role
ORDER BY role;

-- ================================================
-- PASO 7: CREAR FUNCIONES HELPER
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

SELECT '✅ Funciones creadas' as status;

-- ================================================
-- PASO 8: RLS POLICIES PARA user_roles
-- ================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_own"
ON user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_roles_select_admin"
ON user_roles FOR SELECT TO authenticated
USING (public.has_role('admin'));

CREATE POLICY "user_roles_insert_admin"
ON user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'));

CREATE POLICY "user_roles_update_admin"
ON user_roles FOR UPDATE TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

CREATE POLICY "user_roles_delete_admin"
ON user_roles FOR DELETE TO authenticated
USING (public.has_role('admin'));

SELECT '✅ Policies de user_roles creadas' as status;

-- ================================================
-- PASO 9: ACTUALIZAR POLICIES DE usuarios
-- ================================================

DROP POLICY IF EXISTS "usuarios_insert_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_admin_only" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_own_or_admin" ON usuarios;

CREATE POLICY "usuarios_insert_admin_only"
ON usuarios FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'));

CREATE POLICY "usuarios_select_own_or_admin"
ON usuarios FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role('admin'));

SELECT '✅ Policies de usuarios actualizadas' as status;

-- ================================================
-- PASO 10: ACTUALIZAR POLICIES DE mixes
-- ================================================

DROP POLICY IF EXISTS "mixes_select_user_or_admin" ON mixes;

CREATE POLICY "mixes_select_user_or_admin"
ON mixes FOR SELECT TO authenticated
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
ON mixes FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "mixes_update_admin" ON mixes;

CREATE POLICY "mixes_update_admin"
ON mixes FOR UPDATE TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "mixes_delete_admin" ON mixes;

CREATE POLICY "mixes_delete_admin"
ON mixes FOR DELETE TO authenticated
USING (public.has_role('admin'));

SELECT '✅ Policies de mixes actualizadas' as status;

-- ================================================
-- PASO 11: FUNCIÓN DE REGISTRO AUTOMÁTICO
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

SELECT '✅ Función handle_new_user creada' as status;

-- ================================================
-- PASO 12: PRUEBAS FINALES
-- ================================================

SELECT '=== PRUEBAS ===' as info;

-- Prueba 1: Mi rol actual
SELECT 'Mi rol:' as test, public.get_current_user_role() as resultado;

-- Prueba 2: ¿Soy admin?
SELECT '¿Soy admin?:' as test, public.has_role('admin') as resultado;

-- Prueba 3: Mis roles en user_roles
SELECT '=== Mis roles en user_roles ===' as info;
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- Prueba 4: Mi usuario en tabla usuarios
SELECT '=== Mi usuario en tabla usuarios ===' as info;
SELECT id, email, nombre, rol, activo FROM usuarios WHERE id = auth.uid();

-- ================================================
-- ✅ MIGRACIÓN COMPLETADA
-- ================================================

SELECT '
╔═══════════════════════════════════════════════╗
║  ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE ✅      ║
╚═══════════════════════════════════════════════╝
' as "RESULTADO FINAL";

-- Resumen final
SELECT '=== RESUMEN FINAL ===' as info;

SELECT 
  'Tabla user_roles' as elemento,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') 
    THEN '✅ Creada' ELSE '❌ No existe' END as estado
UNION ALL
SELECT 
  'Función has_role()',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'has_role') 
    THEN '✅ Creada' ELSE '❌ No existe' END
UNION ALL
SELECT 
  'Función get_current_user_role()',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_current_user_role') 
    THEN '✅ Creada' ELSE '❌ No existe' END
UNION ALL
SELECT 
  'Policy usuarios_insert_admin_only',
  CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usuarios' AND policyname = 'usuarios_insert_admin_only') 
    THEN '✅ Creada' ELSE '❌ No existe' END
UNION ALL
SELECT 
  'Policy usuarios_select_own_or_admin',
  CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usuarios' AND policyname = 'usuarios_select_own_or_admin') 
    THEN '✅ Creada' ELSE '❌ No existe' END;
