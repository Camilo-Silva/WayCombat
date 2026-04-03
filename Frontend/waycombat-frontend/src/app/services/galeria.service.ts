import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type CategoriaGaleria = 'entrenamientos' | 'jornada-waycombat' | 'eventos';

export interface GaleriaItem {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaGaleria;
  url: string;
  storage_path?: string;
  fecha_creacion: string;
  activo: boolean;
}

export interface CreateGaleriaItemRequest {
  titulo: string;
  descripcion: string;
  categoria: CategoriaGaleria;
  url: string;
  storage_path?: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GaleriaService {

  constructor(private supabase: SupabaseService) {}

  async getAll(): Promise<GaleriaItem[]> {
    const { data, error } = await this.supabase.client
      .from('galeria')
      .select('*')
      .eq('activo', true)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error fetching galeria:', error);
      return [];
    }
    return data || [];
  }

  async getAllAdmin(): Promise<GaleriaItem[]> {
    const { data, error } = await this.supabase.client
      .from('galeria')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error fetching galeria (admin):', error);
      return [];
    }
    return data || [];
  }

  async create(item: CreateGaleriaItemRequest): Promise<GaleriaItem | null> {
    const { data, error } = await this.supabase.client
      .from('galeria')
      .insert({
        titulo: item.titulo,
        descripcion: item.descripcion,
        categoria: item.categoria,
        url: item.url,
        storage_path: item.storage_path || null,
        activo: item.activo,
        fecha_creacion: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating galeria item:', error);
      throw error;
    }
    return data;
  }

  async update(id: string, item: Partial<CreateGaleriaItemRequest>): Promise<GaleriaItem | null> {
    const { data, error } = await this.supabase.client
      .from('galeria')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating galeria item:', error);
      throw error;
    }
    return data;
  }

  async delete(id: string): Promise<void> {
    const item = await this.getById(id);

    // Eliminar archivo de Storage si existe
    if (item?.storage_path) {
      const { error: storageError } = await this.supabase.client.storage
        .from('galeria')
        .remove([item.storage_path]);

      if (storageError) {
        console.warn('No se pudo eliminar el archivo de storage:', storageError);
      }
    }

    const { error } = await this.supabase.client
      .from('galeria')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting galeria item:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<GaleriaItem | null> {
    const { data, error } = await this.supabase.client
      .from('galeria')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Sube una imagen al Supabase Storage y retorna la URL pública + storage_path
   */
  async uploadImage(file: File): Promise<{ url: string; storagePath: string } | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const storagePath = `photos/${fileName}`;

    const { error: uploadError } = await this.supabase.client.storage
      .from('galeria')
      .upload(storagePath, file, { upsert: false });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    const { data } = this.supabase.client.storage
      .from('galeria')
      .getPublicUrl(storagePath);

    return { url: data.publicUrl, storagePath };
  }
}
