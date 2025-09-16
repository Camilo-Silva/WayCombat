# 🔧 Variables de Entorno para Render

## 📋 **Lista Completa de Variables Requeridas**

Copiar y pegar en Render Dashboard → Environment Variables:

### **1. ASPNETCORE_ENVIRONMENT**
```
Key: ASPNETCORE_ENVIRONMENT
Value: Production
```

### **2. ASPNETCORE_URLS**
```
Key: ASPNETCORE_URLS  
Value: http://+:$PORT
```

### **3. PORT**
```
Key: PORT
Value: 8080
```

### **4. JWT_KEY**
```
Key: JWT_KEY
Value: [GENERAR-CLAVE-DE-32-CARACTERES]
```

**Para generar JWT_KEY**, ejecuta en terminal:**
```bash
# Windows PowerShell
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))

# O usar este ejemplo:
ABCDEFGHabcdefgh1234567890123456
```

### **5. PRODUCTION_ORIGIN**
```
Key: PRODUCTION_ORIGIN
Value: https://waycombat.netlify.app
```

### **6. DATABASE_URL**
```
Key: DATABASE_URL
Value: [URL-DE-TU-BASE-DE-DATOS-POSTGRESQL]
```

**Para obtener DATABASE_URL:**
1. Ve a tu base de datos PostgreSQL en Render
2. Clic en **"Connect"** 
3. Copia la **"External Database URL"**
4. Se ve así: `postgres://user:password@host:port/database`

## ⚡ **Orden de Configuración**

1. **PRIMERO**: Crear la base de datos PostgreSQL
2. **SEGUNDO**: Obtener la DATABASE_URL  
3. **TERCERO**: Crear el Web Service con todas las variables

## 🔍 **Dónde Encontrar Environment Variables**

### **Durante la Creación del Servicio:**
- En el formulario de nuevo servicio → Bajar hasta **"Environment Variables"**

### **En un Servicio Existente:**
- Dashboard → Tu Servicio → Panel izquierdo → **"Environment"**

## ✅ **Verificación**

Una vez configuradas todas las variables:
1. Hacer **"Manual Deploy"** del servicio
2. Revisar logs para verificar:
   ```
   🐘 Using PostgreSQL database
   ✅ Database connection successful
   ✅ Database migration completed successfully
   ```