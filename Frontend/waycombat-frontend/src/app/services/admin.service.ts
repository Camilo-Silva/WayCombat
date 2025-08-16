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
  private apiUrl = 'http://localhost:5165/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private mixService: MixService
  ) { }

  // ====== GESTIÓN DE MIXS ======
  
  async getMixs(): Promise<Mix[]> {
    try {
      console.log('🔍 AdminService: Intentando obtener mixs desde:', `${this.apiUrl}/admin/mixs`);
      console.log('🔍 AdminService: Headers:', this.authService.getAuthHeaders());
      
      const response = await firstValueFrom(
        this.http.get<Mix[]>(`${this.apiUrl}/admin/mixs`, {
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
        titulo: mixData.titulo,
        descripcion: mixData.descripcion,
        fechaCreacion: new Date(),
        activo: true,
        archivos: []
      };
    }
  }

  async updateMix(mixId: number, mixData: CreateMixRequest): Promise<Mix> {
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
        titulo: mixData.titulo,
        descripcion: mixData.descripcion,
        fechaCreacion: new Date(),
        activo: true,
        archivos: []
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
        this.http.delete(`${this.apiUrl}/admin/usuarios/${userId}`, {
          headers: this.authService.getAuthHeaders()
        })
      );
    } catch (error) {
      console.error('Error deleting usuario:', error);
      throw error;
    }
  }

  // ====== GESTIÓN DE PERMISOS ======

  async getAccesosMixes(): Promise<AccesoMixDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<AccesoMixDto[]>(`${this.apiUrl}/admin/accesos`, {
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
        this.http.get<any[]>(`${this.apiUrl}/admin/accesos`, {
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
        this.http.post(`${this.apiUrl}/admin/accesos/toggle`, {
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
        fechaCreacion: new Date('2024-01-01')
      },
      {
        id: 2,
        nombre: 'Carlos Rodriguez',
        email: 'carlos@email.com',
        rol: 'usuario',
        fechaCreacion: new Date('2024-01-10')
      },
      {
        id: 3,
        nombre: 'María González',
        email: 'maria@email.com',
        rol: 'usuario',
        fechaCreacion: new Date('2024-01-15')
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
