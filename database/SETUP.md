# Configuración de Base de Datos Neon para WayCombat

## Pasos para configurar Neon PostgreSQL

### 1. Crear cuenta en Neon
1. Ve a [https://neon.tech](https://neon.tech)
2. Crea una cuenta gratuita
3. Verifica tu email

### 2. Crear nuevo proyecto
1. Haz clic en "Create Project"
2. Nombre del proyecto: `waycombat`
3. Región: `US East (Ohio)` (recomendada para mejor latencia)
4. PostgreSQL Version: `15` (latest)
5. Haz clic en "Create Project"

### 3. Obtener string de conexión
1. En el dashboard de tu proyecto, ve a "Connection Details"
2. Copia la "Connection string" que se ve así:
   ```
   postgresql://username:password@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 4. Ejecutar script de inicialización
1. En Neon Console > SQL Editor, ejecuta el contenido de `database/init.sql`
2. O usa tu cliente PostgreSQL favorito con la connection string

### 5. Configurar variables de entorno en Netlify
1. Ve a tu sitio en Netlify Dashboard
2. Site Settings > Environment Variables
3. Agrega estas variables:

```
NETLIFY_DATABASE_URL=tu_connection_string_de_neon
JWT_SECRET=waycombat-production-secret-key-change-this-2024
```

### 6. Verificar configuración
Después de deployar, las funciones deberían:
- Crear las tablas automáticamente si no existen
- Crear el usuario admin automáticamente
- Estar listas para recibir requests

## Estructura de la base de datos

### Tabla: usuarios
- `id`: Serial Primary Key
- `nombre`: VARCHAR(255) - Nombre del usuario
- `email`: VARCHAR(255) UNIQUE - Email único
- `contraseña`: VARCHAR(255) - Hash BCrypt de la contraseña
- `rol`: VARCHAR(50) - 'Usuario' o 'Admin'
- `activo`: BOOLEAN - Estado del usuario
- `fecha_creacion`: TIMESTAMP
- `fecha_actualizacion`: TIMESTAMP

### Tabla: mixes
- `id`: Serial Primary Key
- `titulo`: VARCHAR(255) - Título del mix
- `descripcion`: TEXT - Descripción del contenido
- `archivo_url`: VARCHAR(500) - URL del archivo de video/audio
- `imagen_url`: VARCHAR(500) - URL de la imagen thumbnail
- `duracion`: INTEGER - Duración en segundos
- `tamaño_bytes`: BIGINT - Tamaño del archivo en bytes
- `fecha_creacion`: TIMESTAMP
- `fecha_actualizacion`: TIMESTAMP

### Tabla: acceso_mixes
- `id`: Serial Primary Key
- `usuario_id`: INTEGER - FK a usuarios.id
- `mix_id`: INTEGER - FK a mixes.id
- `fecha_acceso`: TIMESTAMP - Cuándo se otorgó/actualizó el acceso
- `activo`: BOOLEAN - Si el acceso está activo
- Constraint: UNIQUE(usuario_id, mix_id)

## Credenciales por defecto
- **Email admin**: admin@waycombat.com
- **Contraseña admin**: admin123

## Límites de Neon (Plan gratuito)
- 0.5 GB de storage
- 1 proyecto
- Conexiones limitadas (suficiente para desarrollo)

Para producción considera el plan Pro de Neon.