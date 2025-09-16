import { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { verifyToken } from '../utils/jwt';
import bcrypt from 'bcryptjs';

interface CreateUserRequest {
  nombre: string;
  email: string;
  password: string;
  rol?: string;
  activo?: boolean;
}

interface UpdateUserRequest {
  nombre?: string;
  email?: string;
  rol?: string;
  activo?: boolean;
}

export const handler: Handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
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
      // Crear nuevo usuario
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Datos de usuario requeridos' })
        };
      }

      const userData: CreateUserRequest = JSON.parse(event.body);

      // Validar datos requeridos
      if (!userData.nombre || !userData.email || !userData.password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Nombre, email y contraseña son requeridos' })
        };
      }

      // Verificar si el email ya existe
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${userData.email}
      `;

      if (existingUser.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'El email ya está registrado' })
        };
      }

      // Hashear contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Insertar nuevo usuario
      const result = await sql`
        INSERT INTO users (nombre, email, password_hash, rol, activo, fecha_registro)
        VALUES (${userData.nombre}, ${userData.email}, ${hashedPassword}, ${userData.rol || 'Usuario'}, ${userData.activo !== false}, NOW())
        RETURNING id, nombre, email, rol, activo, fecha_registro
      `;

      const newUser = result[0];

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          id: newUser.id,
          nombre: newUser.nombre,
          email: newUser.email,
          rol: newUser.rol,
          activo: newUser.activo,
          fechaRegistro: newUser.fecha_registro
        })
      };

    } else if (event.httpMethod === 'PUT') {
      // Actualizar usuario existente
      const userId = event.queryStringParameters?.id ? parseInt(event.queryStringParameters.id) : null;
      
      if (!userId || isNaN(userId)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'ID de usuario válido requerido' })
        };
      }

      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Datos de usuario requeridos' })
        };
      }

      const userData: UpdateUserRequest = JSON.parse(event.body);

      // Verificar que el usuario existe
      const existingUser = await sql`
        SELECT id FROM users WHERE id = ${userId}
      `;

      if (existingUser.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Usuario no encontrado' })
        };
      }

      // Actualizar usuario usando una query más directa
      let result;
      
      if (userData.nombre && userData.email && userData.rol !== undefined && userData.activo !== undefined) {
        result = await sql`
          UPDATE users 
          SET nombre = ${userData.nombre}, email = ${userData.email}, rol = ${userData.rol}, activo = ${userData.activo}
          WHERE id = ${userId}
          RETURNING id, nombre, email, rol, activo, fecha_registro
        `;
      } else if (userData.nombre && userData.email) {
        result = await sql`
          UPDATE users 
          SET nombre = ${userData.nombre}, email = ${userData.email}
          WHERE id = ${userId}
          RETURNING id, nombre, email, rol, activo, fecha_registro
        `;
      } else if (userData.rol !== undefined) {
        result = await sql`
          UPDATE users 
          SET rol = ${userData.rol}
          WHERE id = ${userId}
          RETURNING id, nombre, email, rol, activo, fecha_registro
        `;
      } else if (userData.activo !== undefined) {
        result = await sql`
          UPDATE users 
          SET activo = ${userData.activo}
          WHERE id = ${userId}
          RETURNING id, nombre, email, rol, activo, fecha_registro
        `;
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'No hay campos válidos para actualizar' })
        };
      }

      const updatedUser = result[0];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: updatedUser.id,
          nombre: updatedUser.nombre,
          email: updatedUser.email,
          rol: updatedUser.rol,
          activo: updatedUser.activo,
          fechaRegistro: updatedUser.fecha_registro
        })
      };

    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ message: 'Método no permitido' })
      };
    }

  } catch (error) {
    console.error('Error en admin-usuarios:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor', error: (error as Error).message })
    };
  }
};