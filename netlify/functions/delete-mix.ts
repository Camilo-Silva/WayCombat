import { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { verifyToken } from '../utils/jwt';

export const handler: Handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

  // Solo permitir DELETE
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Método no permitido' })
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

    // Obtener ID del mix del query parameter
    const mixId = event.queryStringParameters?.id ? parseInt(event.queryStringParameters.id) : null;
    
    if (!mixId || isNaN(mixId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'ID de mix válido requerido' })
      };
    }

    // Conectar a la base de datos
    const sql = neon(process.env.DATABASE_URL!);

    // Verificar que el mix existe
    const mixExists = await sql`
      SELECT id FROM mixes WHERE id = ${mixId}
    `;

    if (mixExists.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Mix no encontrado' })
      };
    }

    // Eliminar accesos relacionados primero
    await sql`
      DELETE FROM acceso_mixes WHERE mix_id = ${mixId}
    `;

    // Eliminar el mix
    await sql`
      DELETE FROM mixes WHERE id = ${mixId}
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Mix eliminado correctamente' })
    };

  } catch (error) {
    console.error('Error eliminando mix:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor', error: (error as Error).message })
    };
  }
};