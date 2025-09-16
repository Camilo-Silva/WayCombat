import { Handler } from '@netlify/functions';
import { LoginDto, AuthResponseDto } from '../types';
import { getUsuarioByEmail, initializeDatabase } from '../utils/database';
import { comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';

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
    // Inicializar base de datos si es necesario
    await initializeDatabase();

    // Parsear body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Body requerido' })
      };
    }

    const loginDto: LoginDto = JSON.parse(event.body);

    // Validar datos
    if (!loginDto.email || !loginDto.contraseña) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email y contraseña son requeridos' })
      };
    }

    // Buscar usuario
    const usuario = await getUsuarioByEmail(loginDto.email);
    if (!usuario) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Credenciales inválidas' })
      };
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Usuario desactivado' })
      };
    }

    // Verificar contraseña
    const isValidPassword = await comparePassword(loginDto.contraseña, usuario.contraseña);
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Credenciales inválidas' })
      };
    }

    // Generar token
    const token = generateToken(usuario);

    // Preparar respuesta
    const response: AuthResponseDto = {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error en login:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor' })
    };
  }
};