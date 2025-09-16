import { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';

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
    const token = extractTokenFromHeader(event.headers.authorization);
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Token requerido' })
      };
    }

    const tokenPayload = verifyToken(token);
    if (!tokenPayload || tokenPayload.rol !== 'Admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ message: 'Acceso denegado. Se requieren permisos de administrador' })
      };
    }

    // Extraer mixId de la URL path o de query parameters
    let mixId;
    
    // Intentar extraer de la URL path primero (/api/mixs/6/archivos)
    const pathSegments = event.path.split('/');
    const mixsIndex = pathSegments.findIndex(segment => segment === 'mixs');
    if (mixsIndex !== -1 && pathSegments[mixsIndex + 1]) {
      mixId = pathSegments[mixsIndex + 1];
    }
    
    // Si no se encontró en el path, intentar en query parameters
    if (!mixId && event.queryStringParameters?.mixId) {
      mixId = event.queryStringParameters.mixId;
    }

    if (!mixId || isNaN(Number(mixId))) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'ID de mix inválido o no proporcionado' })
      };
    }

    // Parsear el cuerpo de la petición
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Datos requeridos' })
      };
    }

    const { archivos } = JSON.parse(event.body);

    if (!archivos || !Array.isArray(archivos)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Lista de archivos requerida' })
      };
    }

    // Conectar a la base de datos
    const sql = neon(process.env.DATABASE_URL!);

    // Verificar que el mix existe
    const mixExists = await sql`
      SELECT id FROM mixes WHERE id = ${mixId}
    `;

    if (mixExists.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Mix no encontrado' })
      };
    }

    // Procesar cada archivo
    const resultados = [];
    for (const archivo of archivos) {
      const { nombre, url, tipo, tamaño } = archivo;

      if (!nombre || !url) {
        continue; // Saltar archivos inválidos
      }

      // Insertar el archivo en la tabla archivos_mix
      const nuevoArchivo = await sql`
        INSERT INTO archivos_mix (mix_id, nombre, url, tipo, tamaño, fecha_subida)
        VALUES (${mixId}, ${nombre}, ${url}, ${tipo || 'unknown'}, ${tamaño || 0}, NOW())
        RETURNING *
      `;

      resultados.push(nuevoArchivo[0]);
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Archivos agregados exitosamente',
        archivos: resultados
      })
    };

  } catch (error) {
    console.error('Error agregando archivos al mix:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error interno del servidor' })
    };
  }
};