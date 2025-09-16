import { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { verifyToken } from '../utils/jwt';
import * as bcrypt from 'bcryptjs';

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

    // Obtener ID del usuario del query parameter
    const userId = event.queryStringParameters?.id ? parseInt(event.queryStringParameters.id) : null;
    
    if (!userId || isNaN(userId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'ID de usuario válido requerido' })
      };
    }

    // Conectar a la base de datos
    const sql = neon(process.env.DATABASE_URL!);

    // Verificar que el usuario existe
    const userCheck = await sql`
      SELECT id, email FROM usuarios WHERE id = ${userId}
    `;

    if (userCheck.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Usuario no encontrado' })
      };
    }

    // Generar nueva contraseña por defecto: 123456
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 11);

    // Actualizar la contraseña en la base de datos
    await sql`
      UPDATE usuarios 
      SET contraseña = ${hashedPassword}
      WHERE id = ${userId}
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Contraseña reseteada correctamente',
        newPassword: newPassword
      })
    };

  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor', error: (error as Error).message })
    };
  }
};