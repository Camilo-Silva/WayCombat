import { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { verifyToken } from '../utils/jwt';
import { CreateMixDto } from '../types';

export const handler: Handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
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

  // Solo permitir PUT
  if (event.httpMethod !== 'PUT') {
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

    // Obtener ID del mix del path
    const pathSegments = event.path.split('/');
    const mixId = parseInt(pathSegments[pathSegments.length - 1]);
    
    if (!mixId || isNaN(mixId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'ID de mix válido requerido' })
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

    // Actualizar mix
    const result = await sql`
      UPDATE mixes 
      SET titulo = ${mixData.titulo}, 
          descripcion = ${mixData.descripcion}, 
          archivo_url = ${mixData.archivoUrl || ''}, 
          imagen_url = ${mixData.imagenUrl || ''}, 
          duracion = ${mixData.duracion || 0}, 
          tamaño_bytes = ${mixData.tamañoBytes || 0}
      WHERE id = ${mixId}
      RETURNING *
    `;

    if (result.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Mix no encontrado' })
      };
    }

    const updatedMix = result[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: updatedMix.id,
        titulo: updatedMix.titulo,
        descripcion: updatedMix.descripcion,
        archivoUrl: updatedMix.archivo_url,
        imagenUrl: updatedMix.imagen_url,
        duracion: updatedMix.duracion,
        tamañoBytes: updatedMix.tamaño_bytes,
        fechaCreacion: updatedMix.fecha_creacion,
        activo: true,
        archivos: []
      })
    };

  } catch (error) {
    console.error('Error actualizando mix:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor', error: (error as Error).message })
    };
  }
};