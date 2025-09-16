import { Handler } from '@netlify/functions';
import { getAllUsuarios, initializeDatabase } from '../utils/database';
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

    // Verificar que sea admin
    if (tokenPayload.rol !== 'Admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ message: 'Acceso denegado. Se requieren permisos de administrador' })
      };
    }

    // Inicializar base de datos si es necesario
    await initializeDatabase();

    // Obtener todos los usuarios
    const usuarios = await getAllUsuarios();

    // Remover contraseñas de la respuesta
    const usuariosSinPassword = usuarios.map(usuario => ({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo,
      fechaCreacion: usuario.fechaCreacion,
      fechaActualizacion: usuario.fechaActualizacion
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(usuariosSinPassword)
    };

  } catch (error) {
    console.error('Error en get-usuarios:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor' })
    };
  }
};