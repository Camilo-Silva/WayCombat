// ============================================================================
// Edge Function: delete-user-complete (CON CORS CONFIGURADO)
// ============================================================================
// Copia este código COMPLETO en Supabase Dashboard > Edge Functions
// Reemplaza TODO el contenido del archivo index.ts de la Edge Function
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2.30.0";

// ============================================================================
// 🔧 CONFIGURACIÓN CORS
// ============================================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Permitir todos los orígenes (cambiar en producción)
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// 📦 INTERFACES
// ============================================================================
interface DeleteUserRequest {
  userId: string;
}

// ============================================================================
// 🚀 HANDLER PRINCIPAL
// ============================================================================
Deno.serve(async (req) => {
  // ============================================================================
  // ✅ MANEJAR PREFLIGHT REQUEST (OPTIONS)
  // ============================================================================
  if (req.method === 'OPTIONS') {
    console.log('🔄 Preflight request recibido');
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log('\n🗑️ ============ INICIO ELIMINACIÓN COMPLETA DE USUARIO ============');
    
    // ============================================================================
    // 🔒 VALIDAR MÉTODO HTTP
    // ============================================================================
    if (req.method !== 'POST') {
      console.log(`❌ Método no permitido: ${req.method}`);
      return new Response(
        JSON.stringify({ error: 'Método no permitido. Usa POST.' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // ============================================================================
    // 📥 OBTENER userId DEL BODY
    // ============================================================================
    let userId: string;
    try {
      const body = await req.json() as DeleteUserRequest;
      userId = body.userId;
      
      if (!userId) {
        throw new Error('userId es requerido');
      }
      
      console.log(`📋 Usuario a eliminar: ${userId}`);
    } catch (error) {
      console.log('❌ Error parseando request body:', error);
      return new Response(
        JSON.stringify({ error: 'Request inválido. Proporciona userId en el body.' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // ============================================================================
    // 🔑 CREAR CLIENTE SUPABASE CON SERVICE ROLE
    // ============================================================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.log('❌ Variables de entorno faltantes');
      return new Response(
        JSON.stringify({ error: 'Configuración del servidor incompleta' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('✅ Cliente Supabase creado con Service Role Key');

    // ============================================================================
    // 👮 VERIFICAR QUE EL CALLER ES ADMIN
    // ============================================================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('❌ No se proporcionó token de autorización');
      return new Response(
        JSON.stringify({ error: 'No autorizado' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obtener el usuario que está haciendo la petición
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !caller) {
      console.log('❌ Token inválido:', authError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`👤 Petición realizada por: ${caller.id}`);

    // Verificar que el caller es admin
    const { data: roleCheck, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleCheck) {
      console.log('❌ Usuario no es admin');
      return new Response(
        JSON.stringify({ error: 'Solo administradores pueden eliminar usuarios' }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Usuario verificado como admin');

    // ============================================================================
    // 📧 OBTENER EMAIL DEL USUARIO ANTES DE ELIMINAR
    // ============================================================================
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('email')
      .eq('id', userId)
      .single();

    const userEmail = usuarioData?.email || 'desconocido';
    console.log(`📧 Email del usuario: ${userEmail}`);

    // ============================================================================
    // 🗑️ PASO 1: ELIMINAR DE acceso_mixes
    // ============================================================================
    console.log('🗑️ PASO 1: Eliminando de acceso_mixes...');
    const { error: accesoError } = await supabase
      .from('acceso_mixes')
      .delete()
      .eq('usuario_id', userId);

    if (accesoError) {
      console.log('⚠️ Error eliminando acceso_mixes (puede no existir):', accesoError);
    } else {
      console.log('✅ Registros de acceso_mixes eliminados');
    }

    // ============================================================================
    // 🗑️ PASO 2: ELIMINAR DE user_roles
    // ============================================================================
    console.log('🗑️ PASO 2: Eliminando de user_roles...');
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) {
      console.log('⚠️ Error eliminando user_roles (puede no existir):', rolesError);
    } else {
      console.log('✅ Registros de user_roles eliminados');
    }

    // ============================================================================
    // 🗑️ PASO 3: ELIMINAR DE usuarios
    // ============================================================================
    console.log('🗑️ PASO 3: Eliminando de usuarios...');
    const { error: usuarioError } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', userId);

    if (usuarioError) {
      console.log('❌ Error eliminando de usuarios:', usuarioError);
      throw new Error(`Error eliminando usuario de la tabla usuarios: ${usuarioError.message}`);
    }

    console.log('✅ Usuario eliminado de tabla usuarios');

    // ============================================================================
    // 🗑️ PASO 4 (CRÍTICO): ELIMINAR DE auth.users
    // ============================================================================
    console.log('🗑️ PASO 4 (CRÍTICO): Eliminando de auth.users...');
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.log('❌ ERROR CRÍTICO eliminando de auth.users:', authDeleteError);
      throw new Error(`Error eliminando usuario de auth.users: ${authDeleteError.message}`);
    }

    console.log('✅ Usuario eliminado de auth.users');

    // ============================================================================
    // ✅ ÉXITO
    // ============================================================================
    const successMessage = `Usuario ${userEmail} (${userId}) eliminado completamente`;
    console.log(`\n✅ ${successMessage}`);
    console.log('🗑️ ============ ELIMINACIÓN COMPLETA EXITOSA ============\n');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: successMessage,
        deletedUserId: userId,
        deletedUserEmail: userEmail
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.log('\n❌ ERROR EN EDGE FUNCTION:', error);
    console.log('🗑️ ============ ELIMINACIÓN FALLÓ ============\n');
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: error
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// ============================================================================
// 📋 NOTAS IMPORTANTES
// ============================================================================
/*
 * 1. CORS configurado para permitir solicitudes desde localhost:4200
 * 2. Maneja OPTIONS (preflight) automáticamente
 * 3. Todos los responses incluyen headers CORS
 * 4. En producción, cambia 'Access-Control-Allow-Origin' a tu dominio específico
 * 
 * Para desplegar:
 * 1. Copia TODO este código
 * 2. Ve a Supabase Dashboard > Edge Functions > delete-user-complete
 * 3. Pega en el editor (reemplaza todo)
 * 4. Click en "Deploy"
 * 5. Prueba desde tu frontend
 */
