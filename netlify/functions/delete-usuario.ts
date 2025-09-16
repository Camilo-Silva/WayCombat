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

    // Obtener ID del usuario del path
    const pathSegments = event.path.split('/');
    const userId = parseInt(pathSegments[pathSegments.length - 1]);
    
    if (!userId || isNaN(userId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'ID de usuario válido requerido' })
      };
    }

    // Conectar a la base de datos
    const sql = neon(process.env.DATABASE_URL!);

    // Verificar que el usuario existe y no es admin
    const userCheck = await sql`
      SELECT id, email, rol FROM usuarios WHERE id = ${userId}
    `;

    if (userCheck.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Usuario no encontrado' })
      };
    }

    if (userCheck[0].rol === 'Admin') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'No se pueden eliminar usuarios administradores' })
      };
    }

    // Eliminar accesos relacionados primero
    await sql`
      DELETE FROM acceso_mixes WHERE usuario_id = ${userId}
    `;

    // Eliminar el usuario
    await sql`
      DELETE FROM usuarios WHERE id = ${userId}
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Usuario eliminado correctamente' })
    };

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor', error: (error as Error).message })
    };
  }
};