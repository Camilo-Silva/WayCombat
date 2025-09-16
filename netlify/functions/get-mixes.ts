import { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';

export const handler: Handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Solo permitir GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Método no permitido' })
    };
  }

  try {
    // Verificar autenticación
    const token = extractTokenFromHeader(event.headers.authorization);
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Token requerido' })
      };
    }

    const tokenPayload = verifyToken(token);
    if (!tokenPayload) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Token inválido' })
      };
    }

    // Conectar a la base de datos
    const sql = neon(process.env.DATABASE_URL!);

    let mixes;

    // Primero verificamos qué columnas existen en la tabla mixes
    console.log('Obteniendo mixes para usuario:', tokenPayload.email, 'rol:', tokenPayload.rol);

    if (tokenPayload.rol === 'Admin') {
      // Los admins ven todos los mixes
      mixes = await sql`
        SELECT 
          id, 
          titulo, 
          descripcion, 
          archivo_url, 
          imagen_url, 
          duracion, 
          COALESCE(tamaño_bytes, 0) as tamaño_bytes,
          fecha_creacion,
          COALESCE(activo, true) as activo
        FROM mixes 
        ORDER BY fecha_creacion DESC
      `;
    } else {
      // Los usuarios normales solo ven mixes asignados y activos
      // Primero verificamos si existen registros en acceso_mixes
      const accesoCount = await sql`SELECT COUNT(*) as count FROM acceso_mixes WHERE usuario_id = ${tokenPayload.id}`;
      console.log('Accesos para usuario', tokenPayload.id, ':', accesoCount[0].count);

      mixes = await sql`
        SELECT DISTINCT
          m.id, 
          m.titulo, 
          m.descripcion, 
          m.archivo_url, 
          m.imagen_url, 
          m.duracion, 
          COALESCE(m.tamaño_bytes, 0) as tamaño_bytes,
          m.fecha_creacion,
          COALESCE(m.activo, true) as activo
        FROM mixes m
        INNER JOIN acceso_mixes am ON m.id = am.mix_id
        WHERE am.usuario_id = ${tokenPayload.id} 
          AND COALESCE(m.activo, true) = true
        ORDER BY m.fecha_creacion DESC
      `;
    }

    console.log('Número de mixes encontrados:', mixes.length);

    // Formatear la respuesta
    const formattedMixes = mixes.map((mix: any) => ({
      id: mix.id,
      titulo: mix.titulo,
      descripcion: mix.descripcion,
      archivoUrl: mix.archivo_url,
      imagenUrl: mix.imagen_url,
      duracion: mix.duracion,
      tamañoBytes: mix.tamaño_bytes || 0,
      fechaCreacion: mix.fecha_creacion,
      activo: mix.activo,
      archivos: [] // Por ahora vacío, se puede implementar después
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formattedMixes)
    };

  } catch (error) {
    console.error('Error obteniendo mixes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Stack trace:', errorStack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Error interno del servidor', 
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
      })
    };
  }
};