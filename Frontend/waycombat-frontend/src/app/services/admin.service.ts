import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { MixService } from './mix.service';
import { SupabaseService } from './supabase.service';
import { Usuario } from '../models/auth.models';
import { Mix, ArchivoMix, CreateMixRequest } from '../models/mix.models';

interface UsuarioMixPermiso {
  usuarioId: string; // UUID
  mixId: string; // UUID
  activo: boolean;
}

interface AccesoMixDto {
  id: string; // UUID
  usuarioId: string; // UUID
  mixId: string; // UUID
  nombreUsuario: string;
  emailUsuario: string;
  tituloMix: string;
  fechaAcceso: Date;
  fechaExpiracion?: Date;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private mixService: MixService
  ) { }

  // ====== GESTIÓN DE MIXS ======
  
  async getMixs(): Promise<Mix[]> {
    try {
      console.log('🔍 AdminService: Obteniendo todos los mixs');
      
      const { data, error } = await this.supabase.client
        .from('mixes')
        .select(`
          *,
          archivos:archivo_mixes(*)
        `)
        .order('fecha_creacion', { ascending: false });

      if (error) {
        console.error('❌ AdminService: Error getting mixs:', error);
        return [];
      }

      console.log('✅ AdminService: Mixs obtenidos exitosamente:', data);
      return this.mapMixes(data || []);
    } catch (error) {
      console.error('❌ AdminService: Error getting mixs:', error);
      return [];
    }
  }

  async createMix(mixData: CreateMixRequest): Promise<Mix | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('mixes')
        .insert({
          titulo: mixData.titulo,
          descripcion: mixData.descripcion,
          activo: true,
          fecha_creacion: new Date().toISOString()
        })
        .select(`
          *,
          archivos:archivo_mixes(*)
        `)
        .single();

      if (error) {
        console.error('Error creating mix:', error);
        throw error;
      }

      return this.mapMix(data);
    } catch (error) {
      console.error('Error creating mix:', error);
      return null;
    }
  }

  async updateMix(mixId: string, mixData: CreateMixRequest): Promise<Mix | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('mixes')
        .update({
          titulo: mixData.titulo,
          descripcion: mixData.descripcion
        })
        .eq('id', mixId)
        .select(`
          *,
          archivos:archivo_mixes(*)
        `)
        .single();

      if (error) {
        console.error('Error updating mix:', error);
        throw error;
      }

      return this.mapMix(data);
    } catch (error) {
      console.error('Error updating mix:', error);
      return null;
    }
  }

  async deleteMix(mixId: string): Promise<void> {
    try {
      // Hard delete (el RLS policy se encarga de la seguridad)
      const { error } = await this.supabase.client
        .from('mixes')
        .delete()
        .eq('id', mixId);

      if (error) {
        console.error('Error deleting mix:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting mix:', error);
      throw error;
    }
  }

  async toggleMixActivo(mixId: string): Promise<void> {
    try {
      // Primero obtener el estado actual
      const { data: currentMix, error: fetchError } = await this.supabase.client
        .from('mixes')
        .select('activo')
        .eq('id', mixId)
        .single();

      if (fetchError) {
        console.error('Error fetching mix:', fetchError);
        throw fetchError;
      }

      // Cambiar el estado
      const { error: updateError } = await this.supabase.client
        .from('mixes')
        .update({ activo: !currentMix.activo })
        .eq('id', mixId);

      if (updateError) {
        console.error('Error toggling mix activo:', updateError);
        throw updateError;
      }
    } catch (error) {
      console.error('Error toggling mix activo:', error);
      throw error;
    }
  }

  // ====== GESTIÓN DE USUARIOS ======

  async getUsuarios(): Promise<Usuario[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('usuarios')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) {
        console.error('❌ AdminService: Error getting usuarios:', error);
        return [];
      }

      console.log('✅ AdminService: Usuarios obtenidos del backend:', data);
      return (data || []).map(item => ({
        id: item.id,
        nombre: item.nombre,
        email: item.email,
        rol: item.rol,
        fechaCreacion: new Date(item.fecha_creacion),
        activo: item.activo
      }));
    } catch (error) {
      console.error('❌ AdminService: Error getting usuarios from backend:', error);
      return [];
    }
  }

  async createUsuario(userData: { nombre: string; email: string; password: string; rol?: string }): Promise<Usuario | null> {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await this.supabase.client.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          nombre: userData.nombre
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario en auth');
      }

      // 2. Crear perfil en tabla usuarios
      const { data: profileData, error: profileError } = await this.supabase.client
        .from('usuarios')
        .insert({
          id: authData.user.id,
          nombre: userData.nombre,
          email: userData.email,
          rol: userData.rol || 'Usuario',
          activo: true,
          fecha_creacion: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Intentar eliminar el usuario de auth si falla la creación del perfil
        await this.supabase.client.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      return {
        id: profileData.id,
        nombre: profileData.nombre,
        email: profileData.email,
        rol: profileData.rol,
        fechaCreacion: new Date(profileData.fecha_creacion),
        activo: profileData.activo
      };
    } catch (error) {
      console.error('Error creating usuario:', error);
      throw error;
    }
  }

  async updateUsuario(userId: string, userData: { nombre: string; email: string; rol?: string }): Promise<Usuario | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('usuarios')
        .update({
          nombre: userData.nombre,
          email: userData.email,
          rol: userData.rol
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating usuario:', error);
        throw error;
      }

      // Si el email cambió, actualizar también en Supabase Auth
      if (data.email !== userData.email) {
        const { error: authError } = await this.supabase.client.auth.admin.updateUserById(
          userId,
          { email: userData.email }
        );

        if (authError) {
          console.error('Error updating auth email:', authError);
          // No lanzar error, el perfil ya se actualizó
        }
      }

      return {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        fechaCreacion: new Date(data.fecha_creacion),
        activo: data.activo
      };
    } catch (error) {
      console.error('Error updating usuario:', error);
      throw error;
    }
  }

  async deleteUsuario(userId: string): Promise<void> {
    try {
      // 1. Eliminar de la tabla usuarios (esto activará CASCADE en Supabase)
      const { error: profileError } = await this.supabase.client
        .from('usuarios')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        throw profileError;
      }

      // 2. Eliminar de Supabase Auth
      const { error: authError } = await this.supabase.client.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Error deleting auth user:', authError);
        // No lanzar error si falla eliminar de auth, el perfil ya se eliminó
      }
    } catch (error) {
      console.error('Error deleting usuario:', error);
      throw error;
    }
  }

  async toggleUsuarioActivo(userId: string): Promise<Usuario | null> {
    try {
      // Primero obtener el estado actual
      const { data: currentUser, error: fetchError } = await this.supabase.client
        .from('usuarios')
        .select('activo')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching usuario:', fetchError);
        throw fetchError;
      }

      // Cambiar el estado
      const { data, error } = await this.supabase.client
        .from('usuarios')
        .update({ activo: !currentUser.activo })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling usuario activo:', error);
        throw error;
      }

      return {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        fechaCreacion: new Date(data.fecha_creacion),
        activo: data.activo
      };
    } catch (error) {
      console.error('Error toggling usuario activo:', error);
      throw error;
    }
  }

  async resetUserPassword(userId: string, newPassword: string = 'WayCombat2025!'): Promise<void> {
    try {
      const { error } = await this.supabase.client.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) {
        console.error('Error resetting user password:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
  }

  // ====== GESTIÓN DE PERMISOS ======

  async getAccesosMixes(): Promise<AccesoMixDto[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('acceso_mixes')
        .select(`
          *,
          usuario:usuarios(nombre, email),
          mix:mixes(titulo)
        `)
        .order('fecha_acceso', { ascending: false });

      if (error) {
        console.error('Error getting accesos:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        usuarioId: item.usuario_id,
        mixId: item.mix_id,
        nombreUsuario: item.usuario?.nombre || '',
        emailUsuario: item.usuario?.email || '',
        tituloMix: item.mix?.titulo || '',
        fechaAcceso: new Date(item.fecha_acceso),
        fechaExpiracion: item.fecha_expiracion ? new Date(item.fecha_expiracion) : undefined,
        activo: item.activo
      }));
    } catch (error) {
      console.error('Error getting accesos:', error);
      return [];
    }
  }

  async assignMixToUser(usuarioId: string, mixId: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('acceso_mixes')
        .insert({
          usuario_id: usuarioId,
          mix_id: mixId,
          fecha_acceso: new Date().toISOString(),
          activo: true
        });

      if (error) {
        console.error('Error assigning mix to user:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error assigning mix to user:', error);
      throw error;
    }
  }

  async removeMixFromUser(usuarioId: string, mixId: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('acceso_mixes')
        .delete()
        .eq('usuario_id', usuarioId)
        .eq('mix_id', mixId);

      if (error) {
        console.error('Error removing mix from user:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error removing mix from user:', error);
      throw error;
    }
  }

  async getPermisos(): Promise<any[]> {
    return this.getAccesosMixes();
  }

  async toggleUsuarioMixPermiso(usuarioId: string, mixId: string): Promise<void> {
    try {
      // Verificar si existe el acceso
      const { data: existingAccess, error: fetchError } = await this.supabase.client
        .from('acceso_mixes')
        .select('id, activo')
        .eq('usuario_id', usuarioId)
        .eq('mix_id', mixId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching acceso:', fetchError);
        throw fetchError;
      }

      if (existingAccess) {
        // Si existe, toggle el estado activo
        const { error: updateError } = await this.supabase.client
          .from('acceso_mixes')
          .update({ activo: !existingAccess.activo })
          .eq('id', existingAccess.id);

        if (updateError) {
          console.error('Error toggling permiso:', updateError);
          throw updateError;
        }
      } else {
        // Si no existe, crear nuevo acceso
        await this.assignMixToUser(usuarioId, mixId);
      }
    } catch (error) {
      console.error('Error toggling permiso:', error);
      throw error;
    }
  }

  // ====== MAPPERS PRIVADOS ======

  private mapMixes(data: any[]): Mix[] {
    return data.map(item => this.mapMix(item));
  }

  private mapMix(item: any): Mix {
    return {
      id: item.id,
      titulo: item.titulo,
      descripcion: item.descripcion,
      fechaCreacion: new Date(item.fecha_creacion),
      activo: item.activo,
      archivos: (item.archivos || [])
        .filter((a: any) => a.activo)
        .map((a: any) => this.mapArchivo(a))
        .sort((a: ArchivoMix, b: ArchivoMix) => a.orden - b.orden)
    };
  }

  private mapArchivo(item: any): ArchivoMix {
    return {
      id: item.id,
      mixId: item.mix_id,
      tipo: item.tipo,
      nombre: item.nombre,
      url: item.url,
      mimeType: item.mime_type,
      tamañoBytes: item.tamaño_bytes,
      orden: item.orden,
      activo: item.activo,
      fechaCreacion: new Date(item.fecha_creacion)
    };
  }
}
