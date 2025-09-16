# 🚀 Configuración Manual de Render - WayCombat

## ⚠️ **IMPORTANTE**
`render.yaml` NO funciona para conectar automáticamente la base de datos. Debe configurarse manualmente.

## 📋 **Pasos de Configuración Manual**

### **Paso 1: Crear PostgreSQL Database**

1. Ve a https://dashboard.render.com
2. Clic en **"New +"** → **"PostgreSQL"**
3. Configuración:
   - **Name**: `waycombat-postgres`
   - **Database**: `waycombat_prod`
   - **User**: `waycombat_user`
   - **Region**: Oregon (US West) - más económico
   - **Plan**: Free
4. Clic en **"Create Database"**
5. **⏳ ESPERAR**: La base de datos tarda ~2-3 minutos en crearse

### **Paso 2: Obtener Connection String**

1. Una vez creada la base de datos, ve a la pestaña **"Connect"**
2. Copia la **"External Database URL"** (postgres://...)
3. **📋 GUARDA ESTA URL** - la necesitarás en el siguiente paso

### **Paso 3: Crear Web Service**

1. En el dashboard, clic en **"New +"** → **"Web Service"**
2. Configuración:
   - **Source**: GitHub Repository
   - **Repository**: `Camilo-Silva/WayCombat`
   - **Branch**: `deployment/railway-postgresql`
   - **Name**: `waycombat-api`
   - **Region**: Oregon (US West)
   - **Build Command**: (Leave empty - using Dockerfile)
   - **Start Command**: (Leave empty - using Dockerfile)

### **Paso 4: Configurar Docker**

1. En **"Advanced"** section:
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Backend/WayCombat.Api/Dockerfile`
   - **Docker Context**: `./Backend/WayCombat.Api`

### **Paso 5: Configurar Variables de Entorno**

En la sección **"Environment Variables"**, agregar:

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:$PORT
PORT=8080
JWT_KEY=[generar-valor-random-32-chars]
PRODUCTION_ORIGIN=https://waycombat.netlify.app
DATABASE_URL=[pegar-la-url-de-postgres-del-paso-2]
```

**Para JWT_KEY**, usar un generador online o ejecutar en terminal:**
```bash
openssl rand -base64 32
```

### **Paso 6: Configurar Health Check**

1. En **"Advanced"** → **"Health Check Path"**: `/health`

### **Paso 7: Deploy**

1. Clic en **"Create Web Service"**
2. **⏳ ESPERAR**: El primer deploy tarda ~5-10 minutos

## 🔍 **Verificación del Deploy**

### **Logs Exitosos Esperados:**
```
🐘 Using PostgreSQL database
📍 Connection configured for host: [db-host]
🔄 Starting database migration...
✅ Database connection successful
✅ Database migration completed successfully
```

### **URL del API:**
```
https://waycombat-api.onrender.com
```

### **Endpoints de Prueba:**
- Health Check: `https://waycombat-api.onrender.com/health`
- Swagger: `https://waycombat-api.onrender.com/swagger`

## 🚨 **Resolución de Problemas**

### **Error: DATABASE_URL not set**
- Verificar que la variable `DATABASE_URL` esté configurada correctamente
- Asegurar que la base de datos esté en estado "Available"

### **Error: Database connection failed**
- Verificar que la DATABASE_URL sea la "External Database URL"
- No usar la "Internal Database URL"

### **Error: Port binding**
- Verificar que `ASPNETCORE_URLS=http://+:$PORT` esté configurado
- Verificar que `PORT=8080` esté configurado

## ✅ **Configuración Completada**

Una vez que el deploy sea exitoso:
1. ✅ Backend funcionando en Render
2. ✅ PostgreSQL conectado y migrado
3. ✅ Listo para deploy del frontend en Netlify

## 🔄 **Deployments Futuros**

Para deployments futuros:
1. Hacer push a la rama `deployment/railway-postgresql`
2. Render automáticamente detectará los cambios y redesplegará