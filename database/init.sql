-- Script SQL para configurar la base de datos WayCombat en Neon PostgreSQL
-- Ejecutar después de crear el proyecto en Neon

-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'Usuario',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla mixes
CREATE TABLE IF NOT EXISTS mixes (
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

-- Crear tabla acceso_mixes
CREATE TABLE IF NOT EXISTS acceso_mixes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    mix_id INTEGER REFERENCES mixes(id) ON DELETE CASCADE,
    fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    UNIQUE(usuario_id, mix_id)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_acceso_mixes_usuario ON acceso_mixes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_acceso_mixes_mix ON acceso_mixes(mix_id);

-- Insertar usuario administrador
-- Nota: La contraseña 'admin123' debe ser hasheada con BCrypt antes de insertar
-- El hash $2a$11$nUYyY5kHXyKiGhJwX5cWK.5VRjKAOAv1FSKR4L3MGGKL8oGLl11q2 corresponde a 'admin123'
INSERT INTO usuarios (nombre, email, contraseña, rol, activo) 
VALUES ('Administrador', 'admin@waycombat.com', '$2a$11$nUYyY5kHXyKiGhJwX5cWK.5VRjKAOAv1FSKR4L3MGGKL8oGLl11q2', 'Admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insertar algunos mixes de ejemplo (opcional)
INSERT INTO mixes (titulo, descripcion, archivo_url, imagen_url, duracion, tamaño_bytes) VALUES
('Mix de Combate Básico', 'Entrenamiento básico de artes marciales', 'https://example.com/mix1.mp4', 'https://example.com/mix1.jpg', 1200, 50000000),
('Técnicas Avanzadas', 'Movimientos avanzados para practicantes experimentados', 'https://example.com/mix2.mp4', 'https://example.com/mix2.jpg', 1800, 75000000)
ON CONFLICT DO NOTHING;

-- Verificar que las tablas se crearon correctamente
SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'mixes' as tabla, COUNT(*) as registros FROM mixes
UNION ALL
SELECT 'acceso_mixes' as tabla, COUNT(*) as registros FROM acceso_mixes;