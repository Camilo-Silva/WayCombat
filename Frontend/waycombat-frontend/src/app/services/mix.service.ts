import { Injectable } from '@angular/core';
import {
  Mix,
  CreateMixRequest,
  UpdateMixRequest,
  ArchivoMix,
  CreateArchivoMixRequest,
  AccesoMix,
  CreateAccesoMixRequest
} from '../models/mix.models';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class MixService {
  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) { }

  // Métodos públicos
  async getAllMixes(): Promise<Mix[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('mixes')
        .select(`
          *,
          archivos:archivo_mixes(*)
        `)
        .eq('activo', true)
        .order('fecha_creacion', { ascending: false });

      if (error) {
        console.error('Error fetching mixes:', error);
        throw error;
      }

      return this.mapMixes(data || []);
    } catch (error) {
      console.error('Error in getAllMixes:', error);
      return [];
    }
  }

  async getMixesByUsuario(userId: string): Promise<Mix[]> {
    try {
      // Obtener los mixes a los que el usuario tiene acceso
      const { data: accesos, error: accesosError } = await this.supabase.client
        .from('acceso_mixes')
        .select('mix_id')
        .eq('usuario_id', userId)
        .eq('activo', true);

      if (accesosError) {
        console.error('Error fetching user access:', accesosError);
        throw accesosError;
      }

      if (!accesos || accesos.length === 0) {
        return [];
      }

      const mixIds = accesos.map(a => a.mix_id);

      // Obtener los mixes con sus archivos
      const { data, error } = await this.supabase.client
        .from('mixes')
        .select(`
          *,
          archivos:archivo_mixes(*)
        `)
        .in('id', mixIds)
        .eq('activo', true)
        .order('fecha_creacion', { ascending: false });

      if (error) {
        console.error('Error fetching mixes:', error);
        throw error;
      }

      return this.mapMixes(data || []);
    } catch (error) {
      console.error('Error in getMixesByUsuario:', error);
      return [];
    }
  }

  async getMixById(mixId: string): Promise<Mix | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('mixes')
        .select(`
          *,
          archivos:archivo_mixes(*)
        `)
        .eq('id', mixId)
        .single();

      if (error) {
        console.error('Error fetching mix:', error);
        throw error;
      }

      if (!data) {
        return null;
      }

      return this.mapMix(data);
    } catch (error) {
      console.error('Error in getMixById:', error);
      return null;
    }
  }

  // Métodos para usuarios logueados
  async getMisMixes(): Promise<Mix[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    return this.getMixesByUsuario(currentUser.id);
  }

  // Métodos de administración (solo para admins)
  async createMix(mix: CreateMixRequest): Promise<Mix | null> {
    try {
      // Obtener el usuario actual (admin)
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        console.error('No hay usuario autenticado');
        return null;
      }

      // Crear el mix
      const { data, error } = await this.supabase.client
        .from('mixes')
        .insert({
          titulo: mix.titulo,
          descripcion: mix.descripcion,
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

      // Auto-asignar el mix al admin que lo creó
      console.log(`🔄 Intentando auto-asignar mix ${data.id} al usuario ${currentUser.id} (${currentUser.email})`);

      const { data: accesoData, error: accesoError } = await this.supabase.client
        .from('acceso_mixes')
        .insert({
          mix_id: data.id,
          usuario_id: currentUser.id,
          activo: true
        })
        .select();

      if (accesoError) {
        console.error('❌ Error auto-asignando mix al admin:', accesoError);
        console.error('Detalles del error:', JSON.stringify(accesoError, null, 2));
        // No lanzamos error aquí, el mix ya se creó correctamente
      } else {
        console.log(`✅ Mix ${data.id} auto-asignado exitosamente al admin ${currentUser.email}`);
        console.log('Datos de acceso creados:', accesoData);
      }

      return this.mapMix(data);
    } catch (error) {
      console.error('Error in createMix:', error);
      return null;
    }
  }

  async updateMix(id: string, mix: UpdateMixRequest): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`[MixService] Actualizando mix ${id} con datos:`, mix);

      // 1. Actualizar información del mix
      const { error: mixError } = await this.supabase.client
        .from('mixes')
        .update({
          titulo: mix.titulo,
          descripcion: mix.descripcion,
          activo: mix.activo
        })
        .eq('id', id);

      if (mixError) {
        console.error('Error updating mix:', mixError);
        return { success: false, message: mixError.message };
      }

      // 2. GESTIÓN DE ARCHIVOS: UPDATE, INSERT, DELETE

      // 2.1. Obtener todos los archivos actuales del mix en BD
      const { data: archivosActuales, error: fetchError } = await this.supabase.client
        .from('archivo_mixes')
        .select('id')
        .eq('mix_id', id);

      if (fetchError) {
        console.error('Error fetching current archivos:', fetchError);
        return { success: false, message: fetchError.message };
      }

      const idsArchivosActuales = (archivosActuales || []).map(a => a.id);
      const idsArchivosEnviados = (mix.archivos || [])
        .filter(a => a.id && typeof a.id === 'string' && a.id.length > 10)
        .map(a => a.id as string);

      // 2.2. Identificar archivos a ELIMINAR (están en BD pero NO en archivosTemporales)
      const idsArchivosAEliminar = idsArchivosActuales.filter(id => !idsArchivosEnviados.includes(id));

      console.log(`[MixService] Archivos a eliminar: ${idsArchivosAEliminar.length}`, idsArchivosAEliminar);

      // 2.3. DELETE: Eliminar archivos que fueron removidos
      for (const archivoId of idsArchivosAEliminar) {
        const { error: deleteError } = await this.supabase.client
          .from('archivo_mixes')
          .delete()
          .eq('id', archivoId);

        if (deleteError) {
          console.error('Error deleting archivo:', deleteError);
          return { success: false, message: deleteError.message };
        }
      }

      // 2.4. Si hay archivos para actualizar/agregar
      if (mix.archivos && mix.archivos.length > 0) {
        // ✅ Separar archivos existentes (tienen UUID válido) de nuevos (id = 0 o sin id)
        // Archivos existentes: tienen id tipo string con formato UUID (más de 10 caracteres)
        // Archivos nuevos: id es 0, null, undefined, o string corto
        const archivosExistentes = mix.archivos.filter(a => {
          return a.id && typeof a.id === 'string' && a.id.length > 10;
        });
        const archivosNuevos = mix.archivos.filter(a => {
          return !a.id || (typeof a.id === 'number' && a.id === 0) || (typeof a.id === 'string' && a.id.length <= 10);
        });

        console.log(`[MixService] Archivos existentes a actualizar: ${archivosExistentes.length}`);
        console.log(`[MixService] Archivos nuevos a insertar: ${archivosNuevos.length}`);

        // ✅ UPDATE: Actualizar archivos existentes
        for (const archivo of archivosExistentes) {
          // ✅ Normalizar tipo: "audio" -> "Audio", "video" -> "Video"
          const tipoNormalizado = archivo.tipo.charAt(0).toUpperCase() + archivo.tipo.slice(1).toLowerCase();

          const { error: archivoError } = await this.supabase.client
            .from('archivo_mixes')
            .update({
              tipo: tipoNormalizado, // ✅ "Audio" o "Video" con mayúscula inicial
              nombre: archivo.nombre,
              url: archivo.url,
              mime_type: archivo.mimeType,
              orden: archivo.orden,
              activo: archivo.activo
            })
            .eq('id', archivo.id);

          if (archivoError) {
            console.error('Error updating archivo:', archivoError);
            return { success: false, message: archivoError.message };
          }
        }

        // ✅ INSERT: Insertar archivos nuevos
        for (const archivo of archivosNuevos) {
          // ✅ Normalizar tipo: "audio" -> "Audio", "video" -> "Video"
          const tipoNormalizado = archivo.tipo.charAt(0).toUpperCase() + archivo.tipo.slice(1).toLowerCase();

          const { error: insertError } = await this.supabase.client
            .from('archivo_mixes')
            .insert({
              mix_id: id, // ✅ Asociar al mix actual
              tipo: tipoNormalizado, // ✅ "Audio" o "Video" con mayúscula inicial
              nombre: archivo.nombre,
              url: archivo.url,
              mime_type: archivo.mimeType,
              orden: archivo.orden,
              activo: archivo.activo ?? true
            });

          if (insertError) {
            console.error('Error inserting new archivo:', insertError);
            return { success: false, message: insertError.message };
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in updateMix:', error);
      return { success: false, message: error?.message || 'Error al actualizar mix' };
    }
  }

  async deleteMix(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`[MixService] Eliminando mix ${id} y sus archivos asociados`);

      // 1. Primero eliminar todos los archivos asociados al mix
      const { error: archivosError } = await this.supabase.client
        .from('archivo_mixes')
        .delete()
        .eq('mix_id', id);

      if (archivosError) {
        console.error('Error deleting archivos:', archivosError);
        return { success: false, message: archivosError.message };
      }

      // 2. Eliminar permisos de acceso al mix
      const { error: permisosError } = await this.supabase.client
        .from('acceso_mixes')
        .delete()
        .eq('mix_id', id);

      if (permisosError) {
        console.error('Error deleting permisos:', permisosError);
        // No retornar error, continuar con la eliminación del mix
        console.warn('Continuando con eliminación del mix a pesar del error en permisos');
      }

      // 3. Finalmente eliminar el mix
      const { error } = await this.supabase.client
        .from('mixes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting mix:', error);
        return { success: false, message: error.message };
      }

      console.log(`✅ Mix ${id} eliminado exitosamente`);
      return { success: true };
    } catch (error: any) {
      console.error('Error in deleteMix:', error);
      return { success: false, message: error?.message || 'Error al eliminar mix' };
    }
  }

  async addArchivo(mixId: string, archivo: CreateArchivoMixRequest): Promise<ArchivoMix | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('archivo_mixes')
        .insert({
          mix_id: mixId,
          tipo: archivo.tipo,
          nombre: archivo.nombre,
          url: archivo.url,
          mime_type: archivo.mimeType,
          // tamano_bytes omitido - columna no existe en schema actual
          orden: archivo.orden || 0,
          activo: true,
          fecha_creacion: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding archivo:', error);
        throw error;
      }

      return this.mapArchivo(data);
    } catch (error) {
      console.error('Error in addArchivo:', error);
      return null;
    }
  }

  async deleteArchivo(mixId: string, archivoId: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Soft delete: cambiar activo a false
      const { error } = await this.supabase.client
        .from('archivo_mixes')
        .update({ activo: false })
        .eq('id', archivoId)
        .eq('mix_id', mixId);

      if (error) {
        console.error('Error deleting archivo:', error);
        return { success: false, message: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in deleteArchivo:', error);
      return { success: false, message: error?.message || 'Error al eliminar archivo' };
    }
  }

  // Gestión de accesos
  async getAccesos(): Promise<AccesoMix[]> {
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
        console.error('Error fetching accesos:', error);
        throw error;
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
      console.error('Error in getAccesos:', error);
      return [];
    }
  }

  async grantAccess(userId: string, mixId: string, fechaExpiracion?: Date): Promise<{ success: boolean; message?: string }> {
    try {
      // Verificar si ya existe un acceso
      const { data: existingAccess } = await this.supabase.client
        .from('acceso_mixes')
        .select('id, activo')
        .eq('usuario_id', userId)
        .eq('mix_id', mixId)
        .single();

      if (existingAccess) {
        // Si existe, actualizar
        const { error } = await this.supabase.client
          .from('acceso_mixes')
          .update({
            activo: true,
            fecha_expiracion: fechaExpiracion?.toISOString() || null,
            fecha_acceso: new Date().toISOString()
          })
          .eq('id', existingAccess.id);

        if (error) {
          console.error('Error updating access:', error);
          return { success: false, message: error.message };
        }
      } else {
        // Si no existe, crear nuevo
        const { error } = await this.supabase.client
          .from('acceso_mixes')
          .insert({
            usuario_id: userId,
            mix_id: mixId,
            fecha_acceso: new Date().toISOString(),
            fecha_expiracion: fechaExpiracion?.toISOString() || null,
            activo: true
          });

        if (error) {
          console.error('Error granting access:', error);
          return { success: false, message: error.message };
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in grantAccess:', error);
      return { success: false, message: error?.message || 'Error al otorgar acceso' };
    }
  }

  async revokeAccess(userId: string, mixId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await this.supabase.client
        .from('acceso_mixes')
        .update({ activo: false })
        .eq('usuario_id', userId)
        .eq('mix_id', mixId);

      if (error) {
        console.error('Error revoking access:', error);
        return { success: false, message: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in revokeAccess:', error);
      return { success: false, message: error?.message || 'Error al revocar acceso' };
    }
  }

  // Mappers privados
  private mapMixes(data: any[]): Mix[] {
    return data.map(item => this.mapMix(item));
  }

  private mapMix(item: any): Mix {
    return {
      id: item.id,
      codigo: item.codigo || 'N/A', // ✅ NUEVO: Código legible
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
      tamañoBytes: item.tamano_bytes || 0, // Default 0 si no existe
      orden: item.orden,
      activo: item.activo,
      fechaCreacion: new Date(item.fecha_creacion)
    };
  }

  // Utilidades para archivos (sin cambios)
  downloadFile(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getFileTypeIcon(mimeType: string): string {
    if (mimeType.startsWith('audio/')) {
      return 'fas fa-music';
    } else if (mimeType.startsWith('video/')) {
      return 'fas fa-video';
    } else if (mimeType.startsWith('image/')) {
      return 'fas fa-image';
    } else {
      return 'fas fa-file';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
