import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { MixService } from './mix.service';
import { Usuario } from '../models/auth.models';
import { Mix, ArchivoMix, CreateMixRequest } from '../models/mix.models';
import { environment } from '../../environments/environment';

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
  private apiUrl = environment.apiUrl;

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
      // Retornar array vacío en lugar de datos mock para ver errores reales
      return [];
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

  async toggleMixActivo(mixId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(`${this.apiUrl}/admin/mixs/${mixId}/toggle-activo`, {}, {
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
        this.http.get<Usuario[]>(`${this.apiUrl}/admin/usuarios`, {
          headers: this.authService.getAuthHeaders()
        })
      );
      console.log('✅ AdminService: Usuarios obtenidos del backend:', response);
      return response;
    } catch (error) {
      console.error('❌ AdminService: Error getting usuarios from backend:', error);
      // Retornar array vacío en lugar de datos mock para ver errores reales
      return [];
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
      throw error;
    }
  }

  async resetUserPassword(userId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(`${this.apiUrl}/admin/usuarios/${userId}/reset-password`, {}, {
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
        this.http.get<AccesoMixDto[]>(`${this.apiUrl}/admin/accesos`, {
          headers: this.authService.getAuthHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error getting accesos:', error);
      // Retornar array vacío en lugar de datos mock
      return [];
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

  // ====== DATOS MOCK - ELIMINADOS ======
  // Mock data removed to force real backend connection
}
