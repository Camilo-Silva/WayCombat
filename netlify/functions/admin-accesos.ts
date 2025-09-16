import { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { verifyToken } from '../utils/jwt';

interface CreateAccesoRequest {
  usuarioId: number;
  mixId: number;
  fechaExpiracion?: string;
}

export const handler: Handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
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

  try {
    // Verificar autenticación
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Token de autorización requerido' })
      };
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.rol !== 'Admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ message: 'Acceso denegado. Se requieren permisos de administrador' })
      };
    }

    // Conectar a la base de datos
    const sql = neon(process.env.DATABASE_URL!);

    if (event.httpMethod === 'POST') {
      // Crear nuevo acceso
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Datos de acceso requeridos' })
        };
      }

      const accesoData: CreateAccesoRequest = JSON.parse(event.body);

      // Validar datos requeridos
      if (!accesoData.usuarioId || !accesoData.mixId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'usuarioId y mixId son requeridos' })
        };
      }

      // Verificar que el usuario y mix existen
      const usuario = await sql`
        SELECT id FROM users WHERE id = ${accesoData.usuarioId}
      `;
      
      const mix = await sql`
        SELECT id FROM mixes WHERE id = ${accesoData.mixId}
      `;

      if (usuario.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Usuario no encontrado' })
        };
      }

      if (mix.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Mix no encontrado' })
        };
      }

      // Verificar si el acceso ya existe
      const existingAcceso = await sql`
        SELECT id FROM acceso_mixes WHERE usuario_id = ${accesoData.usuarioId} AND mix_id = ${accesoData.mixId}
      `;

      if (existingAcceso.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'El acceso ya existe para este usuario y mix' })
        };
      }

      // Insertar nuevo acceso
      const result = await sql`
        INSERT INTO acceso_mixes (usuario_id, mix_id, fecha_acceso, fecha_expiracion, activo)
        VALUES (${accesoData.usuarioId}, ${accesoData.mixId}, NOW(), ${accesoData.fechaExpiracion || null}, true)
        RETURNING *
      `;

      const newAcceso = result[0];

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          id: newAcceso.id,
          usuarioId: newAcceso.usuario_id,
          mixId: newAcceso.mix_id,
          fechaAcceso: newAcceso.fecha_acceso,
          fechaExpiracion: newAcceso.fecha_expiracion,
          activo: newAcceso.activo
        })
      };

    } else if (event.httpMethod === 'DELETE') {
      // Eliminar acceso
      // Extraer usuarioId y mixId del path: /admin/accesos/{usuarioId}/{mixId}
      const pathSegments = event.path.split('/');
      const usuarioId = parseInt(pathSegments[pathSegments.length - 2]);
      const mixId = parseInt(pathSegments[pathSegments.length - 1]);
      
      if (!usuarioId || isNaN(usuarioId) || !mixId || isNaN(mixId)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'IDs de usuario y mix válidos requeridos' })
        };
      }

      // Verificar que el acceso existe
      const existingAcceso = await sql`
        SELECT id FROM acceso_mixes WHERE usuario_id = ${usuarioId} AND mix_id = ${mixId}
      `;

      if (existingAcceso.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Acceso no encontrado' })
        };
      }

      // Eliminar acceso
      await sql`
        DELETE FROM acceso_mixes WHERE usuario_id = ${usuarioId} AND mix_id = ${mixId}
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Acceso eliminado exitosamente' })
      };

    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ message: 'Método no permitido' })
      };
    }

  } catch (error) {
    console.error('Error en admin-accesos:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor', error: (error as Error).message })
    };
  }
};