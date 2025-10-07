# Instrucciones para Backend - Campo Código

## ⚠️ IMPORTANTE: Ejecutar PRIMERO los scripts SQL

Antes de hacer cambios en el backend, debes ejecutar en Supabase SQL Editor:
```sql
-- Archivo: Database/add-codigo-fields.sql
-- Ejecutar TODO el contenido del archivo
```

Esto agregará:
- ✅ Columna `codigo` a tabla `mixes`
- ✅ Columna `codigo` a tabla `usuarios`
- ✅ Triggers para auto-generar códigos
- ✅ Códigos para registros existentes

---

## 📋 Cambios Necesarios en Backend (Si aplica)

### Si estás usando API personalizada (no directo a Supabase):

#### 1. **DTO de Mix** (`MixDto.cs`)
```csharp
public class MixDto
{
    public string Id { get; set; } // UUID
    public string Codigo { get; set; } // ✅ NUEVO: MIX-001, MIX-002, etc.
    public string Titulo { get; set; }
    public string? Descripcion { get; set; }
    public DateTime FechaCreacion { get; set; }
    public bool Activo { get; set; }
    public List<ArchivoMixDto> Archivos { get; set; } = new();
}
```

#### 2. **DTO de Usuario** (`UsuarioDto.cs` o similar)
```csharp
public class UsuarioDto
{
    public string Id { get; set; } // UUID
    public string Codigo { get; set; } // ✅ NUEVO: USR-001, USR-002, etc.
    public string Nombre { get; set; }
    public string Email { get; set; }
    public string Rol { get; set; }
    public DateTime FechaCreacion { get; set; }
    public bool Activo { get; set; }
}
```

#### 3. **Modelo de Base de Datos** (si usas Entity Framework)
```csharp
public class Mix
{
    public Guid Id { get; set; }
    [MaxLength(20)]
    public string Codigo { get; set; } // ✅ NUEVO
    public string Titulo { get; set; }
    // ... resto de campos
}

public class Usuario
{
    public Guid Id { get; set; }
    [MaxLength(20)]
    public string Codigo { get; set; } // ✅ NUEVO
    public string Nombre { get; set; }
    // ... resto de campos
}
```

---

## 🔍 Verificación en Supabase

Después de ejecutar el SQL, verifica que los códigos se generaron:

### Verificar Mixes:
```sql
SELECT id, codigo, titulo, created_at 
FROM mixes 
ORDER BY codigo;
```

Resultado esperado:
```
| id (UUID)                            | codigo  | titulo           |
|--------------------------------------|---------|------------------|
| 90bbc486-f35a-4440-89e1-731205a5c5ea | MIX-001 | Técnicas Básicas |
| 123e4567-e89b-12d3-a456-426614174000 | MIX-002 | Avanzado         |
```

### Verificar Usuarios:
```sql
SELECT id, codigo, nombre, email, created_at 
FROM usuarios 
ORDER BY codigo;
```

Resultado esperado:
```
| id (UUID)                            | codigo  | nombre      | email              |
|--------------------------------------|---------|-------------|--------------------|
| abc12345-f35a-4440-89e1-731205a5c5ea | USR-001 | Admin       | admin@waycombat.com|
| def67890-e89b-12d3-a456-426614174000 | USR-002 | Juan Pérez  | juan@example.com   |
```

---

## ✅ Testing del Sistema

### 1. Crear nuevo Mix (debe auto-generar código)
```sql
INSERT INTO mixes (titulo, descripcion, activo)
VALUES ('Nuevo Mix Test', 'Descripción', true);

-- Verificar que se generó código automático
SELECT codigo, titulo FROM mixes WHERE titulo = 'Nuevo Mix Test';
-- Debería mostrar: MIX-004 (o siguiente número)
```

### 2. Crear nuevo Usuario (debe auto-generar código)
```sql
-- Los usuarios se crean via Supabase Auth, pero el trigger se ejecutará automáticamente
-- El código se asignará cuando se inserte en la tabla usuarios
```

---

## 🎯 Frontend ya está listo

El frontend Angular YA ESTÁ ACTUALIZADO con:
- ✅ Modelos TypeScript con campo `codigo`
- ✅ Admin Dashboard mostrando códigos en lugar de UUIDs
- ✅ Tabla de Mixes: columna "Código" con badge azul
- ✅ Tabla de Usuarios: columna "Código" con badge celeste
- ✅ Matriz de Permisos: códigos en headers de columnas y filas

---

## 📊 Resumen de Cambios

### Base de Datos (Supabase):
- ✅ Campo `codigo VARCHAR(20) UNIQUE` en `mixes`
- ✅ Campo `codigo VARCHAR(20) UNIQUE` en `usuarios`
- ✅ Función `generate_mix_codigo()` + Trigger
- ✅ Función `generate_usuario_codigo()` + Trigger
- ✅ Códigos generados para registros existentes

### Frontend (Angular):
- ✅ Interface `Mix` con campo `codigo: string`
- ✅ Interface `Usuario` con campo `codigo: string`
- ✅ Admin Dashboard mostrando códigos
- ✅ Badges con colores distintivos

### Backend (Opcional - solo si no usas directo Supabase):
- ⏳ Actualizar DTOs para incluir `codigo`
- ⏳ Actualizar mapeos en servicios
- ⏳ Verificar que queries SELECT incluyan el campo `codigo`

---

## 🚨 Importante

1. **EJECUTAR SQL PRIMERO** antes de cualquier cambio en código
2. Los triggers se encargan de todo automáticamente
3. No necesitas modificar la lógica de creación en frontend
4. El código se genera en la base de datos, no en la app
5. Si usas directo Supabase Client, solo necesitas ejecutar el SQL

---

## 🆘 Troubleshooting

**Problema**: Los códigos no aparecen en frontend
- **Solución**: Verifica que ejecutaste el SQL correctamente
- Comprueba con: `SELECT codigo FROM mixes LIMIT 1;`

**Problema**: Error "column codigo does not exist"
- **Solución**: No ejecutaste el ALTER TABLE, ejecuta el SQL completo

**Problema**: Códigos duplicados
- **Solución**: El campo tiene UNIQUE constraint, no debería pasar
- Verifica triggers: `SELECT * FROM pg_trigger WHERE tgname LIKE '%codigo%';`

**Problema**: Nuevos registros no tienen código
- **Solución**: Verifica que los triggers estén activos
- Re-ejecuta la sección de triggers del SQL
