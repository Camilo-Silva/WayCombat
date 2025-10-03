# 🔐 Análisis Completo: Policies Problemáticas en tabla usuarios

## 🚨 Policies Actuales (INSEGURAS)

### ❌ Policy 1: `usuarios_select_all` - **RIESGO ALTO**

```sql
CREATE POLICY "usuarios_select_all"
ON usuarios FOR SELECT TO authenticated
USING (true); -- ⚠️ TODOS pueden ver TODOS los usuarios
```

**Problema:**
- Cualquier usuario autenticado puede hacer `SELECT * FROM usuarios`
- Expone emails, nombres, teléfonos, roles de TODOS los usuarios
- Un usuario malicioso puede extraer toda la base de usuarios

**Riesgo:** 🔴 **CRÍTICO** en producción

---

### ❌ Policy 2: `usuarios_update_all` - **REDUNDANTE**

```sql
-- Ya existe usuarios_update_own que hace lo mismo
CREATE POLICY "usuarios_update_all"
ON usuarios FOR UPDATE TO authenticated
USING (auth.uid() = id);
```

**Problema:**
- Duplica funcionalidad de `usuarios_update_own`
- No agrega seguridad, solo confusión
- Policies duplicadas pueden causar conflictos

**Riesgo:** 🟡 **MEDIO** (no es insegura, pero mala práctica)

---

### ❌ Policy 3: `usuarios_insert_all` - **RIESGO CRÍTICO**

```sql
CREATE POLICY "usuarios_insert_all"
ON usuarios FOR INSERT TO authenticated
WITH CHECK (true); -- ⚠️ CUALQUIERA puede crear usuarios
```

**Problema:**
- Cualquier usuario puede crear cuentas ilimitadas
- Puede intentar crear usuarios con rol 'admin'
- Permite spam de usuarios falsos

**Riesgo:** 🔴 **CRÍTICO**

---

### ✅ Policy 4: `usuarios_delete_own` - **CORRECTA**

```sql
CREATE POLICY "usuarios_delete_own"
ON usuarios FOR DELETE TO authenticated
USING (auth.uid() = id);
```

**Estado:** ✅ Esta policy está bien, permite que usuarios borren su propia cuenta

---

## 🏆 Solución con Tabla user_roles

### ✅ Nuevas Policies SEGURAS

```sql
-- ================================================
-- POLICIES CORREGIDAS CON user_roles
-- ================================================

-- 1. SELECT: Solo tu propia info O si eres admin
DROP POLICY IF EXISTS "usuarios_select_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_own" ON usuarios;

CREATE POLICY "usuarios_select_own_or_admin"
ON usuarios FOR SELECT TO authenticated
USING (
  auth.uid() = id                    -- Tu propia info
  OR public.has_role('admin')        -- O eres admin
);

-- 2. UPDATE: Solo tu propia info O admin puede editar a cualquiera
DROP POLICY IF EXISTS "usuarios_update_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON usuarios;

CREATE POLICY "usuarios_update_own_or_admin"
ON usuarios FOR UPDATE TO authenticated
USING (
  auth.uid() = id                    -- Tu propia info
  OR public.has_role('admin')        -- O eres admin
)
WITH CHECK (
  auth.uid() = id                    -- Solo puedes cambiarte a ti mismo
  OR public.has_role('admin')        -- O eres admin
);

-- 3. INSERT: Solo admins pueden crear usuarios
DROP POLICY IF EXISTS "usuarios_insert_all" ON usuarios;

CREATE POLICY "usuarios_insert_admin_only"
ON usuarios FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'));

-- 4. DELETE: Solo tu propia cuenta O admin puede borrar cualquiera
DROP POLICY IF EXISTS "usuarios_delete_own" ON usuarios;

CREATE POLICY "usuarios_delete_own_or_admin"
ON usuarios FOR DELETE TO authenticated
USING (
  auth.uid() = id                    -- Tu propia cuenta
  OR public.has_role('admin')        -- O eres admin
);
```

---

## 📊 Comparación: ANTES vs DESPUÉS

| Operación | ANTES (Inseguro) | DESPUÉS (Con user_roles) |
|-----------|------------------|--------------------------|
| **Ver usuarios** | ❌ Todos ven TODOS | ✅ Solo tu info o admin ve todos |
| **Crear usuarios** | ❌ Cualquiera puede crear | ✅ Solo admin puede crear |
| **Editar usuarios** | ⚠️ Solo tu info (correcto pero duplicado) | ✅ Tu info o admin edita cualquiera |
| **Borrar usuarios** | ✅ Solo tu cuenta (correcto) | ✅ Tu cuenta o admin borra cualquiera |
| **Subconsultas** | ⚠️ En policies de mixes | ✅ No hay subconsultas |
| **Recursión** | ⚠️ Riesgo potencial | ✅ Imposible |
| **Performance** | ⚠️ Aceptable <1000 users | ✅ Excelente (índices optimizados) |

---

## ✅ Beneficios Adicionales de user_roles

### 1. **Elimina subconsultas en policies de mixes**

**ANTES:**
```sql
CREATE POLICY "mixes_insert_admin"
ON mixes FOR INSERT TO authenticated
WITH CHECK (
  (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
  --      ↑ SUBCONSULTA COSTOSA
);
```

**DESPUÉS:**
```sql
CREATE POLICY "mixes_insert_admin"
ON mixes FOR INSERT TO authenticated
WITH CHECK (
  public.has_role('admin')
  --      ↑ FUNCIÓN OPTIMIZADA con índice
);
```

### 2. **Mejor performance en TODAS las operaciones**

- `has_role('admin')` consulta tabla pequeña (`user_roles`) con índice
- `usuarios` es tabla grande con muchos campos innecesarios
- PostgreSQL puede cachear resultados de `has_role()`

### 3. **Flexibilidad futura**

```sql
-- Agregar nuevos roles fácilmente
INSERT INTO user_roles (user_id, role) VALUES (user_id, 'instructor');

-- Roles temporales (ej: admin temporal por 24h)
INSERT INTO user_roles (user_id, role, expires_at)
VALUES (user_id, 'admin', now() + interval '24 hours');

-- Múltiples roles simultáneos
-- Un usuario puede ser 'instructor' Y 'moderador'
```

### 4. **Auditoría completa**

```sql
-- Ver quién otorgó qué rol y cuándo
SELECT 
  u.email,
  ur.role,
  ur.granted_at,
  admin.email as granted_by_email
FROM user_roles ur
JOIN usuarios u ON u.id = ur.user_id
LEFT JOIN usuarios admin ON admin.id = ur.granted_by
WHERE ur.active = true;
```

---

## 🔧 Migración Automatizada

La tabla `user_roles` **NO rompe nada existente** porque:

1. **Migra automáticamente datos actuales:**
```sql
INSERT INTO user_roles (user_id, role, active, granted_at)
SELECT id, rol, activo, fecha_creacion
FROM usuarios
WHERE rol IS NOT NULL;
```

2. **Frontend sigue funcionando igual:**
   - El campo `rol` en tabla `usuarios` no se elimina
   - Solo agregamos `user_roles` como fuente de verdad
   - Cambios en servicios son mínimos (mostré ejemplos)

3. **Rollback fácil:**
   - Si algo falla, solo ejecutas script de rollback
   - Restaura policies antiguas
   - Borra tabla `user_roles`

---

## 🎯 Implementación Paso a Paso

### Paso 1: Ejecutar `supabase-roles-table.sql` (15 min)

```bash
# En Supabase Dashboard → SQL Editor
# Copiar y pegar supabase-roles-table.sql
# Ejecutar todo el script
```

**Qué hace:**
1. ✅ Crea tabla `user_roles`
2. ✅ Migra datos de `usuarios.rol` a `user_roles`
3. ✅ Crea funciones `has_role()` y `get_current_user_role()`
4. ✅ Configura RLS en `user_roles`
5. ✅ Actualiza policies de `usuarios` (corrige select_all, update_all, insert_all)
6. ✅ Actualiza policies de `mixes` (elimina subconsultas)

### Paso 2: Actualizar `auth.service.ts` (5 min)

Modificar solo 1 función:

```typescript
// ANTES
async loadCurrentUser(): Promise<void> {
  const { data: userData } = await this.supabase.client
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single();
  
  this.currentUserSubject.next(userData);
}

// DESPUÉS
async loadCurrentUser(): Promise<void> {
  const { data: userData } = await this.supabase.client
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // Obtener rol desde user_roles
  const { data: roleData } = await this.supabase.client
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('active', true)
    .single();
  
  this.currentUserSubject.next({
    ...userData,
    rol: roleData?.role || 'usuario'
  });
}
```

### Paso 3: Verificar (5 min)

```sql
-- Verificar migración de roles
SELECT COUNT(*) FROM user_roles; -- Debe tener todos tus usuarios

-- Verificar tu rol
SELECT public.get_current_user_role(); -- 'admin' o 'usuario'

-- Probar que solo admin puede crear usuarios
-- (Como usuario normal, esto debe fallar)
INSERT INTO usuarios (id, email, nombre, rol)
VALUES (gen_random_uuid(), 'test@test.com', 'Test', 'usuario');
-- ERROR: new row violates row-level security policy
```

### Paso 4: Testing en Frontend (10 min)

1. Login como admin → Debería ver admin dashboard
2. Login como usuario normal → NO debería ver admin dashboard
3. Admin intenta crear usuario → Debería funcionar
4. Usuario normal intenta hacer `SELECT * FROM usuarios` en consola → Solo ve su propia info

---

## 🆘 Plan de Rollback (Si algo falla)

```sql
-- Ejecutar esto para volver a estado anterior:

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.has_role(text);
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Restaurar policies antiguas
DROP POLICY IF EXISTS "usuarios_select_own_or_admin" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_own_or_admin" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_admin_only" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete_own_or_admin" ON usuarios;

-- Crear policies antiguas
CREATE POLICY "usuarios_select_all" ON usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "usuarios_update_all" ON usuarios FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "usuarios_insert_all" ON usuarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "usuarios_delete_own" ON usuarios FOR DELETE TO authenticated USING (auth.uid() = id);
```

---

## ✅ Resumen Final

### Sí, la tabla user_roles corrige TODO:

| Policy Problemática | ¿Se corrige? | Cómo |
|---------------------|--------------|------|
| `usuarios_select_all` | ✅ SÍ | Solo ves tu info o eres admin |
| `usuarios_update_all` | ✅ SÍ | Elimina duplicación, admin puede editar todos |
| `usuarios_insert_all` | ✅ SÍ | Solo admin puede insertar |
| Subconsultas en mixes | ✅ SÍ | Usa `has_role()` en lugar de SELECT a usuarios |
| Riesgo de recursión | ✅ SÍ | Imposible con tabla separada |
| Performance | ✅ SÍ | Índices optimizados en tabla pequeña |

### Tiempo total de implementación:
- 🕐 **35 minutos** (15 SQL + 5 TypeScript + 10 testing + 5 verificación)

### Riesgo:
- 🟢 **BAJO** - Migración automática + rollback fácil

---

**¿Procedemos con la implementación?** 🚀

Puedo guiarte paso a paso si quieres.
