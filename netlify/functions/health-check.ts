import { Handler } from '@netlify/functions';

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
    // Verificar variables de entorno
    const checks = {
      netlifyDatabaseUrl: !!process.env.NETLIFY_DATABASE_URL,
      netlifyDatabaseUrlUnpooled: !!process.env.NETLIFY_DATABASE_URL_UNPOOLED,
      jwtSecret: !!process.env.JWT_SECRET,
      context: {
        deployId: context.awsRequestId || 'local',
        region: process.env.AWS_REGION || 'local',
        functionName: context.functionName || 'health-check',
        functionVersion: context.functionVersion || '1.0'
      },
      timestamp: new Date().toISOString()
    };

    // Verificar conectividad con la base de datos
    let dbStatus = 'not_tested';
    try {
      if (process.env.NETLIFY_DATABASE_URL) {
        const { neon } = await import('@netlify/neon');
        const sql = neon();
        await sql`SELECT 1 as test`;
        dbStatus = 'connected';
      }
    } catch (error) {
      dbStatus = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    const status = {
      service: 'WayCombat Netlify Functions',
      status: 'operational',
      checks,
      database: dbStatus,
      readiness: {
        canInitDatabase: checks.netlifyDatabaseUrl,
        canGenerateJWT: checks.jwtSecret,
        ready: checks.netlifyDatabaseUrl && checks.jwtSecret
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(status, null, 2)
    };

  } catch (error) {
    console.error('Error en health check:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        service: 'WayCombat Netlify Functions',
        status: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      })
    };
  }
};