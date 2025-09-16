import { neon } from '@netlify/neon';
import { Usuario, Mix, AccesoMix } from '../types';

// Configuración de la base de datos - Netlify DB usa automáticamente NETLIFY_DATABASE_URL
const sql = neon();

// Funciones para Usuarios
export async function createUsuario(usuario: Omit<Usuario, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Usuario> {
  const now = new Date();
  const result = await sql`
    INSERT INTO usuarios (nombre, email, contraseña, rol, activo, fecha_creacion, fecha_actualizacion)
    VALUES (${usuario.nombre}, ${usuario.email}, ${usuario.contraseña}, ${usuario.rol}, ${usuario.activo}, ${now}, ${now})
    RETURNING *
  `;
  return mapUsuarioFromDb(result[0]);
}

export async function getUsuarioByEmail(email: string): Promise<Usuario | null> {
  const result = await sql`
    SELECT * FROM usuarios WHERE email = ${email} LIMIT 1
  `;
  return result.length > 0 ? mapUsuarioFromDb(result[0]) : null;
}

export async function getUsuarioById(id: number): Promise<Usuario | null> {
  const result = await sql`
    SELECT * FROM usuarios WHERE id = ${id} LIMIT 1
  `;
  return result.length > 0 ? mapUsuarioFromDb(result[0]) : null;
}

export async function getAllUsuarios(): Promise<Usuario[]> {
  const result = await sql`
    SELECT * FROM usuarios ORDER BY fecha_creacion DESC
  `;
  return result.map(mapUsuarioFromDb);
}

export async function updateUsuarioActivo(id: number, activo: boolean): Promise<void> {
  await sql`
    UPDATE usuarios 
    SET activo = ${activo}, fecha_actualizacion = ${new Date()}
    WHERE id = ${id}
  `;
}

// Funciones para Mixes
export async function createMix(mix: Omit<Mix, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Mix> {
  const now = new Date();
  const result = await sql`
    INSERT INTO mixes (titulo, descripcion, archivo_url, imagen_url, duracion, tamaño_bytes, fecha_creacion, fecha_actualizacion)
    VALUES (${mix.titulo}, ${mix.descripcion}, ${mix.archivoUrl}, ${mix.imagenUrl || null}, ${mix.duracion || null}, ${mix.tamañoBytes || null}, ${now}, ${now})
    RETURNING *
  `;
  return mapMixFromDb(result[0]);
}

export async function getAllMixes(): Promise<Mix[]> {
  const result = await sql`
    SELECT * FROM mixes ORDER BY fecha_creacion DESC
  `;
  return result.map(mapMixFromDb);
}

export async function getMixById(id: number): Promise<Mix | null> {
  const result = await sql`
    SELECT * FROM mixes WHERE id = ${id} LIMIT 1
  `;
  return result.length > 0 ? mapMixFromDb(result[0]) : null;
}

export async function deleteMix(id: number): Promise<void> {
  await sql`DELETE FROM mixes WHERE id = ${id}`;
}

// Funciones para AccesoMix
export async function createAccesoMix(usuarioId: number, mixId: number): Promise<AccesoMix> {
  const now = new Date();
  const result = await sql`
    INSERT INTO acceso_mixes (usuario_id, mix_id, fecha_acceso, activo)
    VALUES (${usuarioId}, ${mixId}, ${now}, true)
    ON CONFLICT (usuario_id, mix_id) DO UPDATE SET
      fecha_acceso = ${now}, activo = true
    RETURNING *
  `;
  return mapAccesoMixFromDb(result[0]);
}

export async function getAccesosByUsuario(usuarioId: number): Promise<AccesoMix[]> {
  const result = await sql`
    SELECT * FROM acceso_mixes WHERE usuario_id = ${usuarioId} AND activo = true
  `;
  return result.map(mapAccesoMixFromDb);
}

export async function toggleAccesoMix(usuarioId: number, mixId: number): Promise<void> {
  const existing = await sql`
    SELECT activo FROM acceso_mixes WHERE usuario_id = ${usuarioId} AND mix_id = ${mixId}
  `;
  
  if (existing.length > 0) {
    const newActivo = !existing[0].activo;
    await sql`
      UPDATE acceso_mixes 
      SET activo = ${newActivo}, fecha_acceso = ${new Date()}
      WHERE usuario_id = ${usuarioId} AND mix_id = ${mixId}
    `;
  } else {
    await createAccesoMix(usuarioId, mixId);
  }
}

// Función para inicializar la base de datos
export async function initializeDatabase(): Promise<void> {
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

  // Crear usuario admin si no existe
  const adminExists = await sql`
    SELECT id FROM usuarios WHERE email = 'admin@waycombat.com'
  `;

  if (adminExists.length === 0) {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 11);
    
    await sql`
      INSERT INTO usuarios (nombre, email, contraseña, rol, activo)
      VALUES ('Administrador', 'admin@waycombat.com', ${hashedPassword}, 'Admin', true)
    `;
  }
}

// Funciones de mapeo
function mapUsuarioFromDb(row: any): Usuario {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    contraseña: row.contraseña,
    rol: row.rol as 'Usuario' | 'Admin',
    activo: row.activo,
    fechaCreacion: new Date(row.fecha_creacion),
    fechaActualizacion: new Date(row.fecha_actualizacion)
  };
}

function mapMixFromDb(row: any): Mix {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    archivoUrl: row.archivo_url,
    imagenUrl: row.imagen_url,
    duracion: row.duracion,
    tamañoBytes: row.tamaño_bytes,
    fechaCreacion: new Date(row.fecha_creacion),
    fechaActualizacion: new Date(row.fecha_actualizacion)
  };
}

function mapAccesoMixFromDb(row: any): AccesoMix {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    mixId: row.mix_id,
    fechaAcceso: new Date(row.fecha_acceso),
    activo: row.activo
  };
}