# WayCombat - Migración a Netlify Functions + Netlify DB

## 🎯 Nueva Arquitectura

Esta rama implementa una arquitectura completamente nueva basada en:

- **Frontend**: Angular 17 (sin cambios)
- **Backend**: Netlify Functions (serverless)
- **Base de Datos**: Netlify DB (PostgreSQL serverless)
- **Autenticación**: JWT con bcrypt
- **Deploy**: Todo en Netlify (single platform)

## 📁 Estructura del Proyecto

```
WayCombat/
├── Frontend/waycombat-frontend/        # Angular app (sin cambios)
├── netlify/
│   ├── functions/                      # Netlify Functions (API)
│   │   ├── login.ts                   # POST /api/login
│   │   ├── register.ts                # POST /api/register
│   │   ├── get-mixes.ts              # GET /api/get-mixes
│   │   ├── get-usuarios.ts           # GET /api/get-usuarios
│   │   └── toggle-usuario-activo.ts  # PATCH /api/toggle-usuario-activo
│   ├── types/
│   │   └── index.ts                  # Tipos TypeScript
│   ├── utils/
│   │   ├── database.ts               # Operaciones de base de datos
│   │   ├── jwt.ts                    # Manejo de JWT tokens
│   │   └── bcrypt.ts                 # Hash de contraseñas
│   └── package.json                  # Dependencias de funciones
├── netlify.toml                      # Configuración de Netlify
└── README-NETLIFY.md                 # Este archivo
```

## 🚀 Configuración de Deploy

### 1. Netlify DB Setup

1. Ve a tu dashboard de Netlify
2. Selecciona tu sitio WayCombat
3. Ve a "Add-ons" → "Netlify Connect"
4. Crea una nueva base de datos PostgreSQL
5. Copia la URL de conexión

### 2. Variables de Entorno

En tu dashboard de Netlify, ve a Site settings → Environment variables y agrega:

```
JWT_SECRET=tu-clave-secreta-super-segura-aqui
NETLIFY_DATABASE_URL=postgresql://user:password@host:port/database
```

### 3. Deploy Settings

El archivo `netlify.toml` ya está configurado:

- Base folder: `Frontend/waycombat-frontend`
- Build command: `npm install --include=dev && npx ng build --configuration=production`
- Publish directory: `Frontend/waycombat-frontend/dist/waycombat-frontend`
- Functions directory: `netlify/functions`

## 📊 Base de Datos

### Tablas Creadas Automáticamente

La función `initializeDatabase()` crea automáticamente:

```sql
-- Tabla usuarios
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  contraseña VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'Usuario',
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla mixes
CREATE TABLE mixes (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  archivo_url VARCHAR(500) NOT NULL,
  imagen_url VARCHAR(500),
  duracion INTEGER,
  tamaño_bytes BIGINT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla acceso_mixes
CREATE TABLE acceso_mixes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  mix_id INTEGER REFERENCES mixes(id) ON DELETE CASCADE,
  fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT true,
  UNIQUE(usuario_id, mix_id)
);
```

### Usuario Admin por Defecto

Se crea automáticamente:
- Email: `admin@waycombat.com`
- Contraseña: `admin123`
- Rol: `Admin`

## 🔧 APIs Disponibles

### Autenticación

**POST /api/login**
```json
{
  "email": "admin@waycombat.com",
  "contraseña": "admin123"
}
```

**POST /api/register**
```json
{
  "nombre": "Usuario Test",
  "email": "test@example.com",
  "contraseña": "password123"
}
```

### Mixes (Requiere autenticación)

**GET /api/get-mixes**
- Headers: `Authorization: Bearer <token>`
- Retorna: Lista de todos los mixes

### Admin (Requiere rol Admin)

**GET /api/get-usuarios**
- Headers: `Authorization: Bearer <token>`
- Retorna: Lista de todos los usuarios

**PATCH /api/toggle-usuario-activo/{userId}**
- Headers: `Authorization: Bearer <token>`
- Body: `{ "activo": true/false }`

## 🔄 Cambios en Frontend

Los servicios Angular han sido actualizados para usar Netlify Functions:

### auth.service.ts
```typescript
private apiUrl = '/api'; // Apunta a Netlify Functions

// Datos enviados en formato camelCase (no PascalCase)
const netlifyRequest = {
  email: request.email,
  contraseña: request.contraseña
};
```

### mix.service.ts
```typescript
getAllMixes(): Observable<Mix[]> {
  return this.http.get<Mix[]>(`${this.apiUrl}/get-mixes`);
}
```

### admin.service.ts
```typescript
async getUsuarios(): Promise<Usuario[]> {
  return await firstValueFrom(
    this.http.get<Usuario[]>(`${this.apiUrl}/get-usuarios`, {
      headers: this.authService.getAuthHeaders()
    })
  );
}
```

## 🚀 Deploy Instructions

1. **Hacer commit de esta rama**:
   ```bash
   git add .
   git commit -m "Implement Netlify Functions + Netlify DB architecture"
   git push origin netlify-functions
   ```

2. **En Netlify Dashboard**:
   - Cambiar el branch de deploy de `main` a `netlify-functions`
   - Configurar las variables de entorno
   - Hacer redeploy

3. **Verificar**:
   - Las funciones aparecen en "Functions" tab
   - El login funciona con `admin@waycombat.com` / `admin123`
   - Los mixes se cargan correctamente

## ✅ Ventajas de Esta Arquitectura

1. **Simplicidad**: Todo en una sola plataforma (Netlify)
2. **Costo**: Netlify Functions tiene una capa gratuita generosa
3. **Escalabilidad**: Auto-scaling serverless
4. **Mantenimiento**: Sin servidores que mantener
5. **SSL/HTTPS**: Automático
6. **Global CDN**: Mejor performance mundial

## 🔄 Migración de Datos

Si tienes datos existentes en SQLite, puedes:

1. Exportar datos de la BD SQLite actual
2. Crear scripts de migración usando las funciones de `utils/database.ts`
3. Importar datos via Netlify Functions

## 🐛 Troubleshooting

### Error: "Module not found"
Las dependencias se instalan automáticamente en deploy. Los errores de TypeScript son normales en desarrollo.

### Error 500 en funciones
Revisar logs en Netlify Dashboard → Functions → Logs

### Base de datos no conecta
Verificar `NETLIFY_DATABASE_URL` en variables de entorno

### JWT errors
Verificar `JWT_SECRET` en variables de entorno

## 📞 Soporte

Esta migración mantiene exactamente la misma funcionalidad que el backend ASP.NET Core original, pero con una arquitectura serverless más simple y mantenible.

La funcionalidad completa incluye:
- ✅ Autenticación JWT
- ✅ Registro/Login de usuarios  
- ✅ Gestión de mixes
- ✅ Panel de administración
- ✅ Control de accesos por rol
- ✅ CORS configurado
- ✅ Seguridad bcrypt