import { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { verifyToken } from '../utils/jwt';
import { CreateMixDto } from '../types';

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

    const mixData: CreateMixDto = JSON.parse(event.body);

    // Validar datos requeridos
    if (!mixData.titulo || !mixData.descripcion) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Título y descripción son requeridos' })
      };
    }

    // Conectar a la base de datos
    const sql = neon(process.env.DATABASE_URL!);

    // Insertar nuevo mix
    const result = await sql`
      INSERT INTO mixes (titulo, descripcion, archivo_url, imagen_url, duracion, tamaño_bytes)
      VALUES (${mixData.titulo}, ${mixData.descripcion}, ${mixData.archivoUrl || ''}, ${mixData.imagenUrl || ''}, ${mixData.duracion || 0}, ${mixData.tamañoBytes || 0})
      RETURNING *
    `;

    const newMix = result[0];

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        id: newMix.id,
        titulo: newMix.titulo,
        descripcion: newMix.descripcion,
        archivoUrl: newMix.archivo_url,
        imagenUrl: newMix.imagen_url,
        duracion: newMix.duracion,
        tamañoBytes: newMix.tamaño_bytes,
        fechaCreacion: newMix.fecha_creacion,
        activo: true,
        archivos: []
      })
    };

  } catch (error) {
    console.error('Error creando mix:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor', error: (error as Error).message })
    };
  }
};