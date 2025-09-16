# 🚀 Guía de Deployment - WayCombat

## 📋 Resumen del Sistema de Deployment

### **Arquitectura actual:**
- **Backend**: ASP.NET Core desplegado en **Render** (Docker)
- **Frontend**: Angular desplegado en **Netlify** 
- **Base de datos**: SQLite con volumen persistente en Render
- **Rama de producción**: `produccion`

---

## 🔄 Flujo de Trabajo para Modificaciones

### **Paso 1: Realizar cambios en código**
```bash
# Trabajar en rama main o crear feature branch
git checkout main
# o
git checkout -b feature/nueva-funcionalidad

# Realizar tus modificaciones...
# Editar archivos de frontend, backend, etc.
```

### **Paso 2: Testing local (opcional pero recomendado)**

#### **Backend local:**
```bash
cd "Backend/WayCombat.Api"
# Configurar puerto específico para localhost
$env:PORT = "5165"
dotnet run
# Probar en: http://localhost:5165
```

#### **Frontend local:**
```bash
cd "Frontend/waycombat-frontend"
npm install
npm start
# Probar en: http://localhost:4200
```

#### **Testing con Docker local:**
```bash
# Si quieres probar la versión dockerizada
docker build -t waycombat-test -f Dockerfile Backend/WayCombat.Api/
docker run -p 8080:8080 waycombat-test

# Frontend apuntando a Docker
cd "Frontend/waycombat-frontend"
ng serve --configuration=docker --port=4200
```

### **Paso 3: Merge a rama producción**
```bash
# Commit de cambios
git add .
git commit -m "feat: descripción de la nueva funcionalidad"

# Cambiar a rama producción
git checkout produccion

# Merge de cambios
git merge main
# o si trabajaste en feature branch:
git merge feature/nueva-funcionalidad

# Push a producción
git push origin produccion
```

---

## 🐳 Backend (Render) - Deployment Automático

### **¿Cuándo se redespliega el backend?**
- ✅ **Automáticamente** cuando haces `git push origin produccion`
- ✅ Render detecta cambios en la rama `produccion`
- ✅ **NO** necesitas regenerar Docker manualmente

### **Proceso automático de Render:**
1. Detecta cambios en GitHub (rama `produccion`)
2. Clona el repositorio
3. Ejecuta `docker build` usando tu `Dockerfile`
4. Despliega la nueva imagen
5. Aplica migraciones automáticamente (si hay cambios en BD)

### **URLs del backend:**
- **Producción**: https://way-combat-api.onrender.com
- **Health check**: https://way-combat-api.onrender.com/health
- **Swagger**: https://way-combat-api.onrender.com/swagger

### **Monitorear deployment:**
```bash
# Ver logs en tiempo real:
# 1. Ve a https://dashboard.render.com
# 2. Click en "way-combat-api"
# 3. Pestaña "Logs"
```

---

## 🌐 Frontend (Netlify) - Deployment Automático

### **¿Cuándo se redespliega el frontend?**
- ✅ **Automáticamente** cuando haces `git push origin produccion`
- ✅ Netlify detecta cambios en la rama `produccion`
- ✅ **NO** necesitas hacer build manual

### **Proceso automático de Netlify:**
1. Detecta cambios en GitHub (rama `produccion`)
2. Ejecuta: `npm install --include=dev && npx ng build --configuration=production`
3. Publica en CDN automáticamente

### **URLs del frontend:**
- **Producción**: https://way-combat.netlify.app

### **Monitorear deployment:**
```bash
# Ver logs en tiempo real:
# 1. Ve a https://app.netlify.com
# 2. Click en "way-combat"
# 3. Pestaña "Deploys"
```

---

## 🔧 Tipos de Modificaciones Comunes

### **1. Cambios solo en Frontend**
```bash
# Ejemplo: cambiar UI, agregar componente, etc.
git add Frontend/
git commit -m "feat: nuevo componente de usuario"
git checkout produccion
git merge main
git push origin produccion
# ✅ Solo se redespliega Netlify (2-3 min)
```

### **2. Cambios solo en Backend**
```bash
# Ejemplo: nuevo endpoint, lógica de negocio, etc.
git add Backend/
git commit -m "feat: nuevo endpoint de estadísticas"
git checkout produccion
git merge main
git push origin produccion
# ✅ Solo se redespliega Render (5-7 min)
```

### **3. Cambios en Base de Datos**
```bash
# Agregar migración
cd "Backend/WayCombat.Api"
dotnet ef migrations add NombreDeLaMigracion

git add .
git commit -m "feat: nueva tabla de estadísticas"
git checkout produccion
git merge main
git push origin produccion
# ✅ Render aplicará migraciones automáticamente
```

### **4. Cambios en ambos (Frontend + Backend)**
```bash
git add .
git commit -m "feat: nueva funcionalidad completa"
git checkout produccion
git merge main
git push origin produccion
# ✅ Se redespliegan ambos automáticamente
```

---

## ⚡ Comandos Rápidos

### **Deploy rápido (después de cambios):**
```bash
git add .
git commit -m "feat: descripción del cambio"
git checkout produccion
git merge main
git push origin produccion
```

### **Ver estado de deployments:**
```bash
# Backend
curl https://way-combat-api.onrender.com/health

# Frontend  
curl https://way-combat.netlify.app
```

### **Rollback rápido (si algo sale mal):**
```bash
git checkout produccion
git reset --hard HEAD~1  # Volver al commit anterior
git push --force origin produccion
```

---

## 🚨 Troubleshooting

### **Si falla el deployment de Render:**
1. Ve a https://dashboard.render.com → way-combat-api → Logs
2. Busca errores de compilación o Docker
3. Problemas comunes:
   - Error de sintaxis en C#
   - Dependencias faltantes en .csproj
   - JSON malformado en appsettings

### **Si falla el deployment de Netlify:**
1. Ve a https://app.netlify.com → way-combat → Deploys
2. Busca errores de Angular build
3. Problemas comunes:
   - Error de TypeScript
   - Dependencias faltantes en package.json
   - Problemas de environment

### **Verificar conectividad Backend ↔ Frontend:**
```bash
# Desde el navegador en https://way-combat.netlify.app
# F12 → Network → Intentar login
# Deberías ver requests a: https://way-combat-api.onrender.com/api/*
```

---

## 📊 Tiempos de Deployment Típicos

| Servicio | Tiempo | Triggers |
|----------|--------|----------|
| **Render (Backend)** | 5-7 min | Cambios en Backend/, Dockerfile, o migraciones |
| **Netlify (Frontend)** | 2-3 min | Cambios en Frontend/ |
| **Ambos** | 5-7 min | Se ejecutan en paralelo |

---

## 🔑 URLs Importantes

### **Dashboards:**
- **Render**: https://dashboard.render.com
- **Netlify**: https://app.netlify.com
- **GitHub**: https://github.com/Camilo-Silva/WayCombat

### **Aplicación en vivo:**
- **Frontend**: https://way-combat.netlify.app
- **Backend API**: https://way-combat-api.onrender.com
- **Swagger**: https://way-combat-api.onrender.com/swagger

### **Health Checks:**
- **Backend**: https://way-combat-api.onrender.com/health
- **Frontend**: https://way-combat.netlify.app (debe cargar la app)

---

## 💡 Consejos Pro

1. **Siempre probar localmente** antes de push a producción
2. **Usar commits descriptivos** para facilitar debugging
3. **Verificar health checks** después de cada deploy
4. **Mantener rama `main` estable** y usar `produccion` solo para releases
5. **Backup de BD**: La BD SQLite se mantiene en volumen persistente de Render

---

¡Con este flujo puedes hacer modificaciones y deployments sin complicaciones! 🚀