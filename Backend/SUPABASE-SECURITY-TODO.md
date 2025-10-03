# 🔒 Supabase Security - TODO para Producción

## ⚠️ IMPORTANTE: Policies Temporales Activas

Actualmente las RLS policies de la tabla `usuarios` son **PERMISIVAS** para evitar recursión infinita durante desarrollo.

### Estado Actual (TEMPORAL - Solo Desarrollo):

```sql
-- ⚠️ PERMITE a TODOS los usuarios autenticados ver TODOS los usuarios
CREATE POLICY "usuarios_select_all"
ON usuarios FOR SELECT TO authenticated
USING (true);
```

### 🚨 Riesgos de Seguridad:

1. **Exposición de datos**: Usuarios normales pueden ver emails, nombres y roles de TODOS los usuarios
2. **Sin control de acceso por roles**: No hay diferencia entre usuario común y admin
3. **Violación de privacidad**: Información sensible accesible sin restricción

---

## ✅ Soluciones para PRODUCCIÓN

### **OPCIÓN 1: Supabase Edge Functions (RECOMENDADO)**

Crear funciones serverless que manejen la lógica de autorización:

```bash
# Crear función edge
supabase functions new check-user-access
```

```typescript
// /supabase/functions/check-user-access/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const authHeader = req.headers.get('Authorization')!
  const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

  // Verificar rol SIN causar recursión
  const { data: userData } = await supabaseClient
    .from('usuarios')
    .select('rol, activo')
    .eq('id', user?.id)
    .single()

  return new Response(
    JSON.stringify({ 
      isAdmin: userData?.rol === 'admin',
      isActive: userData?.activo 
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

**Luego en el frontend:**
```typescript
// Llamar a la edge function en lugar de consultar directamente
const { data } = await supabase.functions.invoke('check-user-access');
if (data.isAdmin) {
  // Mostrar panel admin
}
```

---

### **OPCIÓN 2: Tabla Separada de Roles**

Crear una tabla auxiliar que no cause recursión:

```sql
-- 1. Crear tabla de roles
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'Usuario',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Policy simple para user_roles
CREATE POLICY "user_roles_select"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 4. Nueva policy para usuarios usando tabla separada
DROP POLICY IF EXISTS "usuarios_select_all" ON usuarios;

CREATE POLICY "usuarios_select_own"
ON usuarios FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "usuarios_select_admin"
ON usuarios FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 5. Migrar datos existentes
INSERT INTO user_roles (user_id, role)
SELECT id, rol FROM usuarios
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- 6. Trigger para mantener sincronizado
CREATE OR REPLACE FUNCTION sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, NEW.rol)
  ON CONFLICT (user_id) 
  DO UPDATE SET role = NEW.rol;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_role_change
AFTER INSERT OR UPDATE OF rol ON usuarios
FOR EACH ROW EXECUTE FUNCTION sync_user_role();
```

---

### **OPCIÓN 3: Custom Claims en JWT**

Modificar el token JWT para incluir metadata del usuario:

```sql
-- Función que se ejecuta al crear/actualizar usuario
CREATE OR REPLACE FUNCTION public.handle_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar metadata del usuario en auth.users
  UPDATE auth.users
  SET raw_app_metadata = 
    raw_app_metadata || 
    jsonb_build_object('role', NEW.rol, 'active', NEW.activo)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_user_metadata_change
AFTER INSERT OR UPDATE OF rol, activo ON usuarios
FOR EACH ROW EXECUTE FUNCTION handle_user_metadata();
```

```sql
-- Policy usando JWT claims
CREATE POLICY "usuarios_select_by_jwt_role"
ON usuarios FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
  OR id = auth.uid()
);
```

---

## 📋 Checklist antes de Producción

- [ ] Elegir e implementar una de las 3 opciones arriba
- [ ] Eliminar policies temporales (`usuarios_select_all`, `usuarios_insert_all`)
- [ ] Implementar policies restrictivas por rol
- [ ] Probar que usuarios normales NO pueden ver datos de otros usuarios
- [ ] Probar que admins SÍ pueden gestionar todos los usuarios
- [ ] Verificar que la creación de usuarios funciona correctamente
- [ ] Ejecutar tests de penetración básicos
- [ ] Revisar logs de Supabase para detectar intentos de acceso no autorizado

---

## 🧪 Testing de Seguridad

```typescript
// Test 1: Usuario normal NO debe ver otros usuarios
const usuario1 = await supabase.auth.signInWithPassword({
  email: 'user1@test.com',
  password: 'test123'
});

const { data: todosLosUsuarios } = await supabase
  .from('usuarios')
  .select('*');

console.assert(
  todosLosUsuarios?.length === 1 && todosLosUsuarios[0].id === usuario1.data.user?.id,
  '❌ FALLO: Usuario normal puede ver otros usuarios'
);

// Test 2: Admin SÍ debe ver todos los usuarios
const admin = await supabase.auth.signInWithPassword({
  email: 'admin@waycombat.com',
  password: 'admin123'
});

const { data: allUsers } = await supabase
  .from('usuarios')
  .select('*');

console.assert(
  allUsers && allUsers.length > 1,
  '❌ FALLO: Admin no puede ver todos los usuarios'
);
```

---

## 📚 Referencias

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Fecha de creación:** 2 de octubre de 2025  
**Estado:** ⚠️ PENDIENTE - Implementar antes de producción  
**Prioridad:** 🔴 ALTA - Riesgo de seguridad
