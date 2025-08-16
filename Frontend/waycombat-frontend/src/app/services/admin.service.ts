import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { Usuario } from '../models/auth.models';

interface ArchivoMix {
  id?: number;
  nombre: string;
  url: string;
  tipo: 'audio' | 'video';
  descripcion?: string;
}

interface Mix {
  id?: number;
  titulo: string;
  descripcion: string;
  archivos: ArchivoMix[];
  fechaCreacion?: Date;
  activo: boolean;
}

interface UsuarioMixPermiso {
  usuarioId: number;
  mixId: number;
  activo: boolean;
}

interface CreateMixRequest {
  titulo: string;
  descripcion: string;
  activo: boolean;
  archivos: ArchivoMix[];
}

interface UpdateMixRequest {
  titulo: string;
  descripcion: string;
  activo: boolean;
  archivos: ArchivoMix[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:5165/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // ====== GESTIÓN DE MIXS ======
  
  async getMixs(): Promise<Mix[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<Mix[]>(`${this.apiUrl}/admin/mixs`, {
          headers: this.authService.getAuthHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error getting mixs:', error);
      // Retornar datos de ejemplo por ahora
      return this.getMockMixs();
    }
  }

  async createMix(mixData: CreateMixRequest): Promise<Mix> {
    try {
      const response = await firstValueFrom(
        this.http.post<Mix>(`${this.apiUrl}/admin/mixs`, mixData, {
          headers: this.authService.getAuthHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error creating mix:', error);
      // Simular creación exitosa por ahora
      return {
        id: Date.now(),
        ...mixData,
        fechaCreacion: new Date()
      };
    }
  }

  async updateMix(mixId: number, mixData: UpdateMixRequest): Promise<Mix> {
    try {
      const response = await firstValueFrom(
        this.http.put<Mix>(`${this.apiUrl}/admin/mixs/${mixId}`, mixData, {
          headers: this.authService.getAuthHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error updating mix:', error);
      // Simular actualización exitosa por ahora
      return {
        id: mixId,
        ...mixData,
        fechaCreacion: new Date()
      };
    }
  }

  async deleteMix(mixId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/admin/mixs/${mixId}`, {
          headers: this.authService.getAuthHeaders()
        })
      );
    } catch (error) {
      console.error('Error deleting mix:', error);
      // Simular eliminación exitosa por ahora
    }
  }

  async toggleMixActive(mixId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(`${this.apiUrl}/admin/mixs/${mixId}/toggle-active`, {}, {
          headers: this.authService.getAuthHeaders()
        })
      );
    } catch (error) {
      console.error('Error toggling mix active:', error);
      // Simular toggle exitoso por ahora
    }
  }

  // ====== GESTIÓN DE USUARIOS ======
  
  async getUsuarios(): Promise<Usuario[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<Usuario[]>(`${this.apiUrl}/admin/usuarios`, {
          headers: this.authService.getAuthHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error getting usuarios:', error);
      // Retornar datos de ejemplo por ahora
      return this.getMockUsuarios();
    }
  }

  // ====== GESTIÓN DE PERMISOS ======
  
  async getPermisos(): Promise<UsuarioMixPermiso[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<UsuarioMixPermiso[]>(`${this.apiUrl}/admin/permisos`, {
          headers: this.authService.getAuthHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error getting permisos:', error);
      // Retornar datos de ejemplo por ahora
      return this.getMockPermisos();
    }
  }

  async toggleUsuarioMixPermiso(usuarioId: number, mixId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/admin/permisos/toggle`, 
          { usuarioId, mixId }, 
          {
            headers: this.authService.getAuthHeaders()
          }
        )
      );
    } catch (error) {
      console.error('Error toggling permiso:', error);
      // Simular toggle exitoso por ahora
    }
  }

  async assignMixToUsuario(usuarioId: number, mixId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/admin/permisos/assign`, 
          { usuarioId, mixId }, 
          {
            headers: this.authService.getAuthHeaders()
          }
        )
      );
    } catch (error) {
      console.error('Error assigning mix to usuario:', error);
    }
  }

  async removeMixFromUsuario(usuarioId: number, mixId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/admin/permisos/${usuarioId}/${mixId}`, {
          headers: this.authService.getAuthHeaders()
        })
      );
    } catch (error) {
      console.error('Error removing mix from usuario:', error);
    }
  }

  // ====== DATOS DE EJEMPLO (Mock) ======
  
  private getMockMixs(): Mix[] {
    return [
      {
        id: 1,
        titulo: 'Mix Combat Básico',
        descripcion: 'Mix introductorio para principiantes con movimientos básicos',
        activo: true,
        fechaCreacion: new Date('2024-01-15'),
        archivos: [
          {
            id: 1,
            nombre: 'Mix_Basico_Audio.mp3',
            url: 'https://drive.google.com/file/d/1abc123def456/view',
            tipo: 'audio',
            descripcion: 'Audio principal del mix básico'
          },
          {
            id: 2,
            nombre: 'Tutorial_Movimientos_Basicos.mp4',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            tipo: 'video',
            descripcion: 'Video tutorial de movimientos básicos'
          }
        ]
      },
      {
        id: 2,
        titulo: 'Mix Combat Avanzado',
        descripcion: 'Mix para estudiantes avanzados con combinaciones complejas',
        activo: true,
        fechaCreacion: new Date('2024-02-01'),
        archivos: [
          {
            id: 3,
            nombre: 'Mix_Avanzado_Audio.mp3',
            url: 'https://drive.google.com/file/d/1def456ghi789/view',
            tipo: 'audio',
            descripcion: 'Audio del mix avanzado'
          },
          {
            id: 4,
            nombre: 'Coreografia_Avanzada.mp4',
            url: 'https://drive.google.com/file/d/1ghi789jkl012/view',
            tipo: 'video',
            descripcion: 'Video de coreografía avanzada'
          }
        ]
      }
    ];
  }

  private getMockUsuarios(): Usuario[] {
    return [
      {
        id: 1,
        nombre: 'Admin',
        email: 'admin@waycombat.com',
        rol: 'Admin',
        fechaCreacion: new Date('2024-01-01')
      },
      {
        id: 2,
        nombre: 'Juan Pérez',
        email: 'juan@email.com',
        rol: 'Usuario',
        fechaCreacion: new Date('2024-01-15')
      },
      {
        id: 3,
        nombre: 'María García',
        email: 'maria@email.com',
        rol: 'Usuario',
        fechaCreacion: new Date('2024-02-01')
      }
    ];
  }

  private getMockPermisos(): UsuarioMixPermiso[] {
    return [
      { usuarioId: 2, mixId: 1, activo: true },   // Juan tiene acceso al Mix Básico
      { usuarioId: 3, mixId: 1, activo: true },   // María tiene acceso al Mix Básico
      { usuarioId: 3, mixId: 2, activo: true },   // María tiene acceso al Mix Avanzado
    ];
  }
}
