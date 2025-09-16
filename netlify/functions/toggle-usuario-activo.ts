import { Handler } from '@netlify/functions';
import { updateUsuarioActivo, initializeDatabase } from '../utils/database';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';

export const handler: Handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
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

  // Solo permitir PATCH
  if (event.httpMethod !== 'PATCH') {
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

    // Verificar que sea admin
    if (tokenPayload.rol !== 'Admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ message: 'Acceso denegado. Se requieren permisos de administrador' })
      };
    }

    // Extraer userId de la URL
    const pathParts = event.path.split('/');
    console.log('Path parts:', pathParts);
    
    // Buscar el índice donde está toggle-usuario-activo y tomar el siguiente
    const toggleIndex = pathParts.findIndex(part => part === 'toggle-usuario-activo');
    const userId = parseInt(pathParts[toggleIndex + 1]);

    console.log('Extracted userId:', userId);

    if (!userId || isNaN(userId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'ID de usuario inválido' })
      };
    }

    // Parsear body para obtener el nuevo estado
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Body requerido' })
      };
    }

    const { activo } = JSON.parse(event.body);
    if (typeof activo !== 'boolean') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Campo activo requerido (boolean)' })
      };
    }

    // Inicializar base de datos si es necesario
    await initializeDatabase();

    // Actualizar estado del usuario
    await updateUsuarioActivo(userId, activo);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Estado del usuario actualizado correctamente' })
    };

  } catch (error) {
    console.error('Error en toggle-usuario-activo:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor' })
    };
  }
};