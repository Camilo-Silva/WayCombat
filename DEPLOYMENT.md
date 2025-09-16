# 🔄 WayCombat - Guía de Entornos de Desarrollo y Producción

## 📋 Configuración Dual de Bases de Datos

Este proyecto está configurado para funcionar con **SQLite en desarrollo** y **PostgreSQL en producción**, manteniendo ambos entornos completamente separados y funcionales.

## 🏗️ Arquitectura de Entornos

```
🔧 DESARROLLO           🚀 PRODUCCIÓN
├── SQLite              ├── PostgreSQL (Render)
├── localhost:5165      ├── Render API URL
├── localhost:4200      ├── Netlify Frontend
└── appsettings.json    └── Variables de entorno
```

## 🖥️ Backend - Comandos Rápidos

### Desarrollo con SQLite (Por Defecto)
```bash
cd Backend/WayCombat.Api

# Ejecutar en modo desarrollo
dotnet run

# O usando npm scripts
npm run dev
```

### Desarrollo con PostgreSQL (Testing)
```bash
cd Backend/WayCombat.Api

# Ejecutar con PostgreSQL local
npm run dev:postgres

# O manualmente
$env:UsePostgreSQL="true"
dotnet run
```

### Producción
```bash
cd Backend/WayCombat.Api

# Ejecutar en modo producción
npm run prod

# Build para deployment
npm run build
```

## 🌐 Frontend - Comandos Rápidos

### Desarrollo (localhost:5165)
```bash
cd Frontend/waycombat-frontend

# Servidor de desarrollo
ng serve
# Apunta a: http://localhost:5165/api
```

### Producción (Railway API)
```bash
cd Frontend/waycombat-frontend

# Build para producción
ng build --configuration production
# Apunta a: https://waycombat-api.up.railway.app/api
```

## ⚙️ Variables de Configuración

### Backend - appsettings.json
```json
{
  "UsePostgreSQL": false,          // true = PostgreSQL, false = SQLite
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=waycombat_dev.db",
    "PostgreSQLConnection": "PostgreSQL connection string"
  },
  "ProductionOrigin": "https://waycombat.netlify.app"
}
```

### Frontend - Environments
```typescript
// src/environments/environment.ts (Desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5165/api'
};

// src/environments/environment.prod.ts (Producción)
export const environment = {
  production: true,
  apiUrl: 'https://waycombat-api.up.railway.app/api'
};
```

## 🔄 Workflow de Desarrollo

### 1. Desarrollo Local (SQLite)
```bash
# Terminal 1 - Backend
cd Backend/WayCombat.Api
npm run dev

# Terminal 2 - Frontend  
cd Frontend/waycombat-frontend
ng serve
```

### 2. Testing con PostgreSQL Local
```bash
# Setup PostgreSQL local (opcional)
cd Backend/WayCombat.Api
npm run dev:postgres
```

### 3. Deploy a Producción
```bash
# 1. Merge a main
git checkout main
git merge deployment/render-postgresql

# 2. Push triggers auto-deployment
git push origin main

# Render auto-detecta Dockerfile
# Netlify auto-detecta cambios en frontend
```

## 🗄️ Manejo de Bases de Datos

### SQLite (Desarrollo)
```bash
# Aplicar migraciones
cd Backend/WayCombat.Api
npm run migrate:dev

# Crear nueva migración
npm run migrate:add NombreMigracion
```

### PostgreSQL (Producción)
```bash
# Aplicar migraciones a PostgreSQL
cd Backend/WayCombat.Api
npm run migrate:postgres

# Railway auto-aplica migraciones en deploy
```

## 🚀 URLs de Acceso

### Desarrollo
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:5165
- **Swagger**: http://localhost:5165 (solo en development)

### Producción
- **Frontend**: https://waycombat.netlify.app
- **Backend API**: https://waycombat-api.onrender.com
- **Database**: PostgreSQL automático en Render

## 🔧 Troubleshooting

### Error: No se puede conectar a la base de datos
```bash
# Verificar configuración
cd Backend/WayCombat.Api
echo $env:UsePostgreSQL  # debe ser true/false según necesidad
```

### Error: CORS en producción
- Verificar que `ProductionOrigin` esté configurado correctamente
- Verificar que las URLs de frontend y backend coincidan

### Error: Variables de entorno en Render
- Todas las variables se configuran automáticamente
- `DATABASE_URL` se genera automáticamente
- `JWT_KEY` se debe configurar manualmente

## 📝 Notas Importantes

1. **Nunca commitear** archivos de configuración con credenciales reales
2. **SQLite es solo para desarrollo** - no usar en producción
3. **Las migraciones se aplican automáticamente** en Railway
4. **El switching es automático** basado en el entorno de ejecución

## 🎯 Próximos Pasos

2. ✅ Configuración dual completada
3. 🔄 Deploy a Render (siguiente)
4. 🔄 Deploy a Netlify (siguiente)
5. 🔄 Configurar variables de producción