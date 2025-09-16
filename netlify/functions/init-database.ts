import { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';

export const handler: Handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Manejar OPTIONS para CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Método no permitido' })
    };
  }

  try {
    const sql = neon();

    // Crear tabla usuarios
    await sql`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        contraseña VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'Usuario',
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Crear tabla mixes
    await sql`
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
      )
    `;

    // Crear tabla acceso_mixes
    await sql`
      CREATE TABLE IF NOT EXISTS acceso_mixes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        mix_id INTEGER REFERENCES mixes(id) ON DELETE CASCADE,
        fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT true,
        UNIQUE(usuario_id, mix_id)
      )
    `;

    // Crear índices
    await sql`CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_acceso_mixes_usuario ON acceso_mixes(usuario_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_acceso_mixes_mix ON acceso_mixes(mix_id)`;

    // Verificar si admin existe
    const adminExists = await sql`
      SELECT id FROM usuarios WHERE email = 'admin@waycombat.com'
    `;

    if (adminExists.length === 0) {
      // Crear hash BCrypt para admin123
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 11);
      
      await sql`
        INSERT INTO usuarios (nombre, email, contraseña, rol, activo)
        VALUES ('Administrador', 'admin@waycombat.com', ${hashedPassword}, 'Admin', true)
      `;
    }

    // Insertar algunos mixes de ejemplo si no existen
    const mixCount = await sql`SELECT COUNT(*) as count FROM mixes`;
    if (mixCount[0].count === '0') {
      await sql`
        INSERT INTO mixes (titulo, descripcion, archivo_url, imagen_url, duracion, tamaño_bytes) VALUES
        ('Mix de Combate Básico', 'Entrenamiento básico de artes marciales para principiantes', 'https://example.com/mix1.mp4', 'https://example.com/mix1.jpg', 1200, 50000000),
        ('Técnicas Avanzadas', 'Movimientos avanzados para practicantes experimentados', 'https://example.com/mix2.mp4', 'https://example.com/mix2.jpg', 1800, 75000000),
        ('Calentamiento y Estiramiento', 'Rutina completa de calentamiento y flexibilidad', 'https://example.com/mix3.mp4', 'https://example.com/mix3.jpg', 900, 35000000)
      `;
    }

    // Obtener estadísticas
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM usuarios) as usuarios,
        (SELECT COUNT(*) FROM mixes) as mixes,
        (SELECT COUNT(*) FROM acceso_mixes) as accesos
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Base de datos inicializada correctamente',
        stats: stats[0],
        adminCreated: adminExists.length === 0,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Error inicializando base de datos',
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    };
  }
};