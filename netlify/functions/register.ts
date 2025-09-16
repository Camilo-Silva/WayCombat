import { Handler } from '@netlify/functions';
import { RegisterDto, AuthResponseDto } from '../types';
import { createUsuario, getUsuarioByEmail, initializeDatabase } from '../utils/database';
import { hashPassword } from '../utils/bcrypt';
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

    const registerDto: RegisterDto = JSON.parse(event.body);

    // Validar datos
    if (!registerDto.nombre || !registerDto.email || !registerDto.password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Nombre, email y contraseña son requeridos' })
      };
    }

    // Verificar si el email ya existe
    const existingUser = await getUsuarioByEmail(registerDto.email);
    if (existingUser) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ message: 'El email ya está registrado' })
      };
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(registerDto.password);

    // Crear usuario
    const nuevoUsuario = await createUsuario({
      nombre: registerDto.nombre,
      email: registerDto.email,
      contraseña: hashedPassword,
      rol: 'Usuario',
      activo: true
    });

    // Generar token
    const token = generateToken(nuevoUsuario);

    // Preparar respuesta
    const response: AuthResponseDto = {
      token,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error en register:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor' })
    };
  }
};