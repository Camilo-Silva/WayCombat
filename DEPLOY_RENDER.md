# 🚀 Guía de Despliegue en Render con Docker

Esta guía te permitirá desplegar tu aplicación WayCombat en Render usando Docker con persistencia de la base de datos SQLite.

## 📋 Prerequisitos

- [x] Docker Desktop instalado y funcionando
- [x] Proyecto subido a GitHub
- [x] Cuenta en [Render.com](https://render.com)

## 🔧 Configuración Local (Opcional)

### Probar con Docker Compose localmente

```bash
# En la raíz del proyecto WayCombat
docker-compose up --build

# La aplicación estará disponible en http://localhost:8080
# Para detener: Ctrl+C y luego
docker-compose down
```

## 🌐 Despliegue en Render

### Paso 1: Crear un Web Service

1. **Accede a tu dashboard de Render**
   - Ve a [dashboard.render.com](https://dashboard.render.com)
   - Haz clic en **"New +"** en la esquina superior derecha
   - Selecciona **"Web Service"**

### Paso 2: Conectar tu repositorio

1. **Conecta GitHub**
   - Selecciona **"Build and deploy from a Git repository"**
   - Conecta tu cuenta de GitHub si no lo has hecho
   - Busca y selecciona tu repositorio **"WayCombat"**
   - Selecciona la rama **"produccion"**

### Paso 3: Configurar el servicio

1. **Información básica**
   - **Name**: `waycombat-api` (o el nombre que prefieras)
   - **Region**: Selecciona la región más cercana a tus usuarios
   - **Branch**: `produccion`

2. **Configuración de Build**
   - **Runtime**: Selecciona **"Docker"**
   - **Build Command**: (dejar vacío - Docker se encarga)
   - **Start Command**: (dejar vacío - definido en Dockerfile)

### Paso 4: Variables de entorno

En la sección **"Environment Variables"**, agrega:

```
ASPNETCORE_ENVIRONMENT=Production
DATABASE_PATH=/app/data/waycombat_dev.db
PORT=8080
```

**⚠️ IMPORTANTE**: La variable `PORT` es requerida por Render.

### Paso 5: 💾 Configurar Disco Persistente (CRUCIAL)

1. **En la sección "Disks"**
   - Haz clic en **"Add Disk"**
   - **Name**: `waycombat-database`
   - **Mount Path**: `/app/data`
   - **Size**: `1 GB` (suficiente para SQLite)

2. **¿Por qué es importante?**
   - Sin disco persistente, tu base de datos SQLite se perdería con cada redeploy
   - El disco se monta en `/app/data` donde el Dockerfile coloca la base de datos
   - Render mantendrá tus datos entre deployments

### Paso 6: Plan de facturación

- **Free Tier**: Disponible pero con limitaciones (duerme después de inactividad)
- **Starter Plan**: $7/mes - Recomendado para producción

### Paso 7: Deploy

1. **Revisar configuración**
   - Verifica que todo esté correcto
   - Especialmente el disco persistente en `/app/data`

2. **Iniciar deployment**
   - Haz clic en **"Create Web Service"**
   - Render comenzará a construir tu imagen Docker
   - El primer deploy puede tomar 5-10 minutos

## 📊 Monitoreo del Deploy

### Durante el build verás:

```
Building image...
Step 1/XX : FROM mcr.microsoft.com/dotnet/aspnet:9.0
...
Successfully built image
Deploying...
```

### Logs para verificar:

```
App started on port 8080
Database connected successfully
```

## 🔍 Verificación Post-Deploy

### 1. Verificar que la aplicación esté funcionando

- **URL de la aplicación**: `https://tu-servicio.onrender.com`
- **Health check**: `https://tu-servicio.onrender.com/health` (si tienes endpoint)

### 2. Verificar la base de datos

- Los datos deben persistir entre redeploys
- Puedes verificar esto haciendo cambios y luego redeployando

### 3. Logs de la aplicación

- En el dashboard de Render, pestaña **"Logs"**
- Busca por errores de conexión de base de datos

## 🔧 Solución de Problemas Comunes

### Error: Puerto incorrecto
```
Error binding to port
```
**Solución**: Verifica que `PORT=8080` esté en las variables de entorno.

### Error: Base de datos no encontrada
```
SQLite Error: unable to open database file
```
**Solución**: Verifica que el disco persistente esté montado en `/app/data`.

### Build fallido
```
Docker build failed
```
**Solución**: Revisa los logs del build. Usualmente es un problema con las dependencias.

## 🔄 Redeploy Automático

- **Cada push** a la rama `produccion` activará un redeploy automático
- **Los datos de SQLite se mantendrán** gracias al disco persistente
- **Tiempo de downtime**: ~2-3 minutos durante redeploy

## 📝 Comandos Útiles para Debug

### Ver logs en tiempo real (desde dashboard):
- Ve a tu servicio → pestaña "Logs"
- Los logs se actualizan en tiempo real

### Conectar via SSH (Plan Starter+):
```bash
# Desde el dashboard de Render
render shell tu-servicio
```

## 🎯 Configuración Adicional Recomendada

### 1. Custom Domain (Opcional)
- Ve a "Settings" → "Custom Domains"
- Agrega tu dominio personalizado

### 2. Health Checks
- Render verificará automáticamente que tu app responda en el puerto 8080
- Considera agregar un endpoint `/health` en tu aplicación

### 3. Environment-specific Settings
- Usa diferentes variables para Development vs Production
- Considera usar secretos para información sensible

---

## ✅ Checklist Final

Antes de hacer el deploy, verifica:

- [ ] Dockerfile creado en la raíz del proyecto
- [ ] docker-compose.yml para pruebas locales
- [ ] .dockerignore para optimizar el build
- [ ] Variables de entorno configuradas en Render
- [ ] **Disco persistente configurado en `/app/data`**
- [ ] Branch `produccion` seleccionada
- [ ] Plan de facturación seleccionado

---

¡Tu aplicación WayCombat debería estar funcionando en Render con persistencia completa de datos! 🎉