import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { MixService } from './mix.service';
import { Usuario } from '../models/auth.models';
import { Mix, ArchivoMix, CreateMixRequest } from '../models/mix.models';

interface UsuarioMixPermiso {
  usuarioId: number;
  mixId: number;
  activo: boolean;
}

interface AccesoMixDto {
  id: number;
  usuarioId: number;
  mixId: number;
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
  private apiUrl = '/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private mixService: MixService
  ) { }

  // ====== GESTIÓN DE MIXS ======
  
  async getMixs(): Promise<Mix[]> {
    try {
      console.log('🔍 AdminService: Intentando obtener mixs desde:', `${this.apiUrl}/get-mixes`);
      console.log('🔍 AdminService: Headers:', this.authService.getAuthHeaders());
      
      const response = await firstValueFrom(
        this.http.get<Mix[]>(`${this.apiUrl}/get-mixes`, {
          headers: this.authService.getAuthHeaders()
        })
      );
      
      console.log('✅ AdminService: Mixs obtenidos exitosamente:', response);
      return response;
    } catch (error) {
      console.error('❌ AdminService: Error getting mixs:', error);
      console.error('❌ AdminService: Cayendo a datos mock');
      // Retornar datos de ejemplo por ahora
      return this.getMockMixs();
    }
  }

  async createMix(mixData: CreateMixRequest): Promise<Mix> {
    try {
      const response = await firstValueFrom(
        this.http.post<Mix>(`${this.apiUrl}/create-mix`, mixData, {
          headers: this.authService.getAuthHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error creating mix:', error);
      throw error;
    }
  }

  async updateMix(mixId: number, mixData: CreateMixRequest): Promise<Mix> {
    try {
      const response = await firstValueFrom(
        this.http.put<Mix>(`${this.apiUrl}/update-mix/${mixId}`, mixData, {
          headers: this.authService.getAuthHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error updating mix:', error);
      throw error;
    }
  }

  async deleteMix(mixId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/delete-mix/${mixId}`, {
          headers: this.authService.getAuthHeaders()
        })
      );
    } catch (error) {
      console.error('Error deleting mix:', error);
      throw error;
    }
  }

  async toggleMixActivo(mixId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(`${this.apiUrl}/toggle-mix-activo/${mixId}`, {}, {
          headers: this.authService.getAuthHeaders()
        })
      );
    } catch (error) {
      console.error('Error toggling mix activo:', error);
      throw error;
    }
  }

  // ====== GESTIÓN DE USUARIOS ======

  async getUsuarios(): Promise<Usuario[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<Usuario[]>(`${this.apiUrl}/get-usuarios`, {
          headers: this.authService.getAuthHeaders()
        })
      );
      console.log('✅ AdminService: Usuarios obtenidos del backend:', response);
      return response;
    } catch (error) {
      console.error('❌ AdminService: Error getting usuarios from backend:', error);
      console.log('🔄 AdminService: Usando datos mock para usuarios');
      return this.getMockUsuarios();
    }
  }

  async createUsuario(userData: any): Promise<Usuario> {
    try {
      const response = await firstValueFrom(
        this.http.post<Usuario>(`${this.apiUrl}/admin/usuarios`, userData, {
          headers: this.authService.getAuthHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error creating usuario:', error);
      throw error;
    }
  }

  async updateUsuario(userId: number, userData: any): Promise<Usuario> {
    try {
      const response = await firstValueFrom(
        this.http.put<Usuario>(`${this.apiUrl}/admin/usuarios/${userId}`, userData, {
          headers: this.authService.getAuthHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error updating usuario:', error);
      throw error;
    }
  }

  async deleteUsuario(userId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/delete-usuario/${userId}`, {
          headers: this.authService.getAuthHeaders()
        })
      );
    } catch (error) {
      console.error('Error deleting usuario:', error);
      // Re-lanzar el error para que el componente lo maneje
      throw error;
    }
  }

  async toggleUsuarioActivo(userId: number): Promise<Usuario> {
    try {
      const response = await firstValueFrom(
        this.http.patch<Usuario>(`${this.apiUrl}/admin/usuarios/${userId}/toggle-activo`, {}, {
          headers: this.authService.getAuthHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error toggling usuario activo:', error);
      // Fallback: simular el toggle localmente
      const usuarios = this.getMockUsuarios();
      const usuario = usuarios.find(u => u.id === userId);
      if (usuario) {
        usuario.activo = !usuario.activo;
        return usuario;
      }
      throw error;
    }
  }

  async resetUserPassword(userId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(`${this.apiUrl}/reset-user-password/${userId}`, {}, {
          headers: this.authService.getAuthHeaders()
        })
      );
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
  }

  // ====== GESTIÓN DE PERMISOS ======

  async getAccesosMixes(): Promise<AccesoMixDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<AccesoMixDto[]>(`${this.apiUrl}/get-accesos`, {
          headers: this.authService.getAuthHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error getting accesos:', error);
      return this.getMockAccesos();
    }
  }

  async assignMixToUser(usuarioId: number, mixId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/admin/accesos`, {
          usuarioId,
          mixId,
          activo: true
        }, {
          headers: this.authService.getAuthHeaders()
        })
      );
    } catch (error) {
      console.error('Error assigning mix to user:', error);
      throw error;
    }
  }

  async removeMixFromUser(usuarioId: number, mixId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/admin/accesos/${usuarioId}/${mixId}`, {
          headers: this.authService.getAuthHeaders()
        })
      );
    } catch (error) {
      console.error('Error removing mix from user:', error);
      throw error;
    }
  }

  async getPermisos(): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/get-accesos`, {
          headers: this.authService.getAuthHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error getting permisos:', error);
      return [];
    }
  }

  async toggleUsuarioMixPermiso(usuarioId: number, mixId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/toggle-acceso`, {
          usuarioId,
          mixId
        }, {
          headers: this.authService.getAuthHeaders()
        })
      );
    } catch (error) {
      console.error('Error toggling permiso:', error);
      throw error;
    }
  }

  // ====== DATOS MOCK ======

  private getMockMixs(): Mix[] {
    return [
      {
        id: 1,
        titulo: 'Mix Combat Básico',
        descripcion: 'Entrenamiento básico de combate con técnicas fundamentales',
        fechaCreacion: new Date('2024-01-15'),
        activo: true,
        archivos: [
          {
            id: 1,
            mixId: 1,
            nombre: 'Mix_Basico_Audio.mp3',
            url: 'https://drive.google.com/file/d/1abc123def456/view',
            tipo: 'Audio',
            mimeType: 'audio/mpeg',
            orden: 1,
            activo: true,
            fechaCreacion: new Date('2024-01-15')
          },
          {
            id: 2,
            mixId: 1,
            nombre: 'Tutorial_Movimientos_Basicos.mp4',
            url: 'https://drive.google.com/file/d/2def456ghi789/view',
            tipo: 'Video',
            mimeType: 'video/mp4',
            orden: 2,
            activo: true,
            fechaCreacion: new Date('2024-01-15')
          }
        ]
      },
      {
        id: 2,
        titulo: 'Mix Combat Avanzado',
        descripcion: 'Entrenamiento avanzado con técnicas de combate especializado',
        fechaCreacion: new Date('2024-02-10'),
        activo: true,
        archivos: [
          {
            id: 3,
            mixId: 2,
            nombre: 'Mix_Avanzado_Audio.mp3',
            url: 'https://drive.google.com/file/d/3ghi789jkl012/view',
            tipo: 'Audio',
            mimeType: 'audio/mpeg',
            orden: 1,
            activo: true,
            fechaCreacion: new Date('2024-02-10')
          },
          {
            id: 4,
            mixId: 2,
            nombre: 'Coreografia_Avanzada.mp4',
            url: 'https://drive.google.com/file/d/4jkl012mno345/view',
            tipo: 'Video',
            mimeType: 'video/mp4',
            orden: 2,
            activo: true,
            fechaCreacion: new Date('2024-02-10')
          }
        ]
      }
    ];
  }

  private getMockUsuarios(): Usuario[] {
    return [
      {
        id: 1,
        nombre: 'Admin Principal',
        email: 'admin@waycombat.com',
        rol: 'admin',
        fechaCreacion: new Date('2024-01-01'),
        activo: true
      },
      {
        id: 2,
        nombre: 'Carlos Rodriguez',
        email: 'carlos@email.com',
        rol: 'usuario',
        fechaCreacion: new Date('2024-01-10'),
        activo: true
      },
      {
        id: 3,
        nombre: 'María González',
        email: 'maria@email.com',
        rol: 'usuario',
        fechaCreacion: new Date('2024-01-15'),
        activo: false
      }
    ];
  }

  private getMockAccesos(): AccesoMixDto[] {
    return [
      {
        id: 1,
        usuarioId: 2,
        mixId: 1,
        nombreUsuario: 'Carlos Rodriguez',
        emailUsuario: 'carlos@email.com',
        tituloMix: 'Mix Combat Básico',
        fechaAcceso: new Date('2024-01-20'),
        activo: true
      },
      {
        id: 2,
        usuarioId: 3,
        mixId: 1,
        nombreUsuario: 'María González',
        emailUsuario: 'maria@email.com',
        tituloMix: 'Mix Combat Básico',
        fechaAcceso: new Date('2024-01-22'),
        fechaExpiracion: new Date('2024-03-22'),
        activo: true
      },
      {
        id: 3,
        usuarioId: 2,
        mixId: 2,
        nombreUsuario: 'Carlos Rodriguez',
        emailUsuario: 'carlos@email.com',
        tituloMix: 'Mix Combat Avanzado',
        fechaAcceso: new Date('2024-02-15'),
        activo: true
      }
    ];
  }
}
