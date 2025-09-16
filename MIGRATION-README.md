# WayCombat - Migración a Netlify Functions

Esta rama (`netlify-functions`) contiene la migración completa del backend de ASP.NET Core a Netlify Functions + Neon PostgreSQL.

## 🏗️ Nueva Arquitectura

- **Frontend**: Angular 17 (sin cambios en la lógica)
- **Backend**: Netlify Functions (TypeScript)
- **Base de datos**: Neon PostgreSQL (reemplaza SQLite)
- **Despliegue**: 100% en Netlify

## 🚀 Pasos para Deploy

### 1. Configurar Base de Datos
Sigue las instrucciones en `database/SETUP.md` para:
- Crear proyecto en Neon
- Ejecutar script de inicialización
- Obtener connection string

### 2. Configurar Netlify
1. Conecta el repositorio a Netlify
2. Configura variables de entorno:
   ```
   NETLIFY_DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/dbname?sslmode=require
   JWT_SECRET=tu-secret-key-super-seguro
   ```
3. Deploy automático desde la rama `netlify-functions`

### 3. Verificar Funcionamiento
- Login: `POST /api/login`
- Register: `POST /api/register`
- Get Mixes: `GET /api/get-mixes`
- Admin: `GET /api/get-usuarios`

## 📁 Estructura del Proyecto

```
netlify/
├── functions/           # Netlify Functions (TypeScript)
│   ├── login.ts        # Autenticación - Login
│   ├── register.ts     # Autenticación - Registro
│   ├── get-mixes.ts    # Obtener lista de mixes
│   ├── get-usuarios.ts # Admin - Lista de usuarios
│   └── toggle-acceso.ts # Admin - Gestionar accesos
├── types/
│   └── index.ts        # Interfaces TypeScript
├── utils/
│   ├── database.ts     # Funciones de BD (Neon)
│   ├── jwt.ts          # Utilidades JWT
│   └── bcrypt.ts       # Hash de contraseñas
└── package.json        # Dependencias Functions

database/
├── init.sql            # Script de inicialización BD
└── SETUP.md           # Instrucciones detalladas

Frontend/waycombat-frontend/
└── src/app/services/   # Servicios actualizados para Functions
    ├── auth.service.ts    # → /api/login, /api/register
    ├── mix.service.ts     # → /api/get-mixes
    └── admin.service.ts   # → /api/get-usuarios, /api/toggle-acceso
```

## 🔑 Credenciales por Defecto

- **Email**: admin@waycombat.com
- **Contraseña**: admin123

## 🎯 Ventajas de la Nueva Arquitectura

1. **Simplicidad**: Una sola plataforma (Netlify)
2. **Escalabilidad**: Functions serverless auto-scaling
3. **Mantenimiento**: Menos infraestructura que gestionar
4. **Costos**: Plan gratuito cubre desarrollo y pequeña producción
5. **Performance**: CDN global automático

## 📊 Comparación de Arquitecturas

| Aspecto | Anterior (ASP.NET) | Nuevo (Netlify) |
|---------|-------------------|-----------------|
| Frontend | Angular en Netlify | Angular en Netlify |
| Backend | ASP.NET en Railway | Netlify Functions |
| BD | PostgreSQL en Railway | Neon PostgreSQL |
| Deploy | 2 plataformas | 1 plataforma |
| Configuración | Compleja | Simple |
| Escalado | Manual | Automático |

## 🔧 Desarrollo Local

```bash
# Instalar dependencias de functions
cd netlify
npm install

# Ejecutar en modo desarrollo
npm run dev

# El frontend sigue igual
cd ../Frontend/waycombat-frontend
npm install
ng serve
```

## 📝 Migration Log

- ✅ Creada estructura Netlify Functions
- ✅ Migrado AuthController → login.ts + register.ts
- ✅ Migrado MixsController → get-mixes.ts
- ✅ Migrado AdminController → get-usuarios.ts + toggle-acceso.ts
- ✅ Configurado Neon PostgreSQL
- ✅ Actualizados servicios Angular
- ✅ Configurado JWT y BCrypt en Functions
- ✅ Creado sistema de inicialización automática de BD

## 🚨 Notas Importantes

1. **Variables de entorno**: Configurar `NETLIFY_DATABASE_URL` y `JWT_SECRET`
2. **CORS**: Las functions manejan CORS automáticamente
3. **Inicialización**: La BD se inicializa automáticamente en el primer request
4. **Seguridad**: Cambiar `JWT_SECRET` en producción
5. **Backups**: Neon maneja backups automáticamente

## 🧪 Testing

Todas las funciones incluyen manejo de errores y logging. Para debugging:
- Netlify Functions logs en Dashboard
- Console.log statements para troubleshooting
- Postman collection para testing manual