import { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { verifyToken } from '../utils/jwt';

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

    // Parsear body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Body requerido' })
      };
    }

    const { usuarioId, mixId } = JSON.parse(event.body);

    // Validar datos
    if (!usuarioId || !mixId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'usuarioId y mixId son requeridos' })
      };
    }

    // Conectar a la base de datos
    const sql = neon(process.env.DATABASE_URL!);

    // Verificar que el usuario y mix existen
    const userCheck = await sql`SELECT id FROM usuarios WHERE id = ${usuarioId}`;
    const mixCheck = await sql`SELECT id FROM mixes WHERE id = ${mixId}`;

    if (userCheck.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Usuario no encontrado' })
      };
    }

    if (mixCheck.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Mix no encontrado' })
      };
    }

    // Verificar si ya existe el acceso
    const existingAccess = await sql`
      SELECT id FROM acceso_mixes 
      WHERE usuario_id = ${usuarioId} AND mix_id = ${mixId}
    `;

    let action: string;

    if (existingAccess.length > 0) {
      // Si existe, eliminarlo (quitar acceso)
      await sql`
        DELETE FROM acceso_mixes 
        WHERE usuario_id = ${usuarioId} AND mix_id = ${mixId}
      `;
      action = 'removed';
    } else {
      // Si no existe, crearlo (dar acceso)
      await sql`
        INSERT INTO acceso_mixes (usuario_id, mix_id)
        VALUES (${usuarioId}, ${mixId})
      `;
      action = 'granted';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: `Acceso ${action === 'granted' ? 'otorgado' : 'removido'} correctamente`,
        usuarioId,
        mixId,
        action
      })
    };

  } catch (error) {
    console.error('Error toggling acceso:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor', error: (error as Error).message })
    };
  }
};