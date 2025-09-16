import { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
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
        body: JSON.stringify({ message: 'Token de autorización requerido' })
      };
    }

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

    console.log('Obteniendo accesos para admin:', decoded.email);

    // Primero verificamos si las tablas existen y tienen datos
    const tablesCheck = await sql`
      SELECT 
        (SELECT COUNT(*) FROM acceso_mixes) as acceso_count,
        (SELECT COUNT(*) FROM usuarios) as usuarios_count,
        (SELECT COUNT(*) FROM mixes) as mixes_count
    `;
    
    console.log('Estado de las tablas:', tablesCheck[0]);

    // Obtener todos los accesos con información detallada
    const accesos = await sql`
      SELECT 
        am.id,
        am.usuario_id,
        am.mix_id,
        u.nombre as nombre_usuario,
        u.email as email_usuario,
        m.titulo as titulo_mix,
        am.fecha_creacion as fecha_acceso,
        COALESCE(am.fecha_expiracion, NULL) as fecha_expiracion,
        true as activo
      FROM acceso_mixes am
      INNER JOIN usuarios u ON am.usuario_id = u.id
      INNER JOIN mixes m ON am.mix_id = m.id
      ORDER BY am.fecha_creacion DESC
    `;

    console.log('Número de accesos encontrados:', accesos.length);

    // Formatear respuesta
    const accesosFormatted = accesos.map((acceso: any) => ({
      id: acceso.id,
      usuarioId: acceso.usuario_id,
      mixId: acceso.mix_id,
      nombreUsuario: acceso.nombre_usuario,
      emailUsuario: acceso.email_usuario,
      tituloMix: acceso.titulo_mix,
      fechaAcceso: acceso.fecha_acceso,
      fechaExpiracion: acceso.fecha_expiracion,
      activo: acceso.activo
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(accesosFormatted)
    };

  } catch (error) {
    console.error('Error obteniendo accesos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error details:', errorMessage);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Error interno del servidor', 
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
      })
    };
  }
};