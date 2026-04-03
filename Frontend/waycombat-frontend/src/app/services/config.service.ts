import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ConfiguracionItem {
  clave: string;
  valor: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  constructor(private supabase: SupabaseService) {}

  async getAll(): Promise<ConfiguracionItem[]> {
    const { data, error } = await this.supabase.client
      .from('configuracion')
      .select('*')
      .order('clave');
    if (error) {
      console.error('Error fetching configuracion:', error);
      return [];
    }
    return data || [];
  }

  async get(clave: string): Promise<ConfiguracionItem | null> {
    const { data, error } = await this.supabase.client
      .from('configuracion')
      .select('*')
      .eq('clave', clave)
      .single();
    if (error) return null;
    return data;
  }

  async upsert(item: ConfiguracionItem): Promise<void> {
    const { error } = await this.supabase.client
      .from('configuracion')
      .upsert(item, { onConflict: 'clave' });
    if (error) {
      console.error('Error saving configuracion:', error);
      throw error;
    }
  }

  async upsertMany(items: ConfiguracionItem[]): Promise<void> {
    const { error } = await this.supabase.client
      .from('configuracion')
      .upsert(items, { onConflict: 'clave' });
    if (error) {
      console.error('Error saving configuracion:', error);
      throw error;
    }
  }
}
