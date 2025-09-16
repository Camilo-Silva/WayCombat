import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class MixService {
  private apiUrl = '/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Métodos públicos
  getAllMixes(): Observable<Mix[]> {
    return this.http.get<Mix[]>(`${this.apiUrl}/get-mixes`);
  }

  getMixesByUsuario(userId: number): Observable<Mix[]> {
    return this.http.get<Mix[]>(`${this.apiUrl}/mixs/usuario/${userId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getMixById(mixId: number): Observable<Mix> {
    return this.http.get<Mix>(`${this.apiUrl}/mixs/${mixId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Métodos para usuarios logueados
  getMisMixes(): Observable<Mix[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    return this.getMixesByUsuario(currentUser.id);
  }

  // Métodos de administración (solo para admins)
  createMix(mix: CreateMixRequest): Observable<Mix> {
    return this.http.post<Mix>(`${this.apiUrl}/mixs`, mix, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateMix(id: number, mix: UpdateMixRequest): Observable<any> {
    console.log(`[MixService] Enviando PUT a /mixs/${id} con datos:`, mix); // Debug
    return this.http.put(`${this.apiUrl}/mixs/${id}`, mix, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteMix(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/mixs/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  addArchivo(mixId: number, archivo: CreateArchivoMixRequest): Observable<ArchivoMix> {
    return this.http.post<ArchivoMix>(`${this.apiUrl}/mixs/${mixId}/archivos`, archivo, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteArchivo(mixId: number, archivoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/mixs/${mixId}/archivos/${archivoId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Gestión de accesos
  getAccesos(): Observable<AccesoMix[]> {
    return this.http.get<AccesoMix[]>(`${this.apiUrl}/admin/accesos`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  grantAccess(userId: number, mixId: number, fechaExpiracion?: Date): Observable<any> {
    const request: CreateAccesoMixRequest = {
      usuarioId: userId,
      mixId: mixId,
      fechaExpiracion: fechaExpiracion
    };

    return this.http.put(`${this.apiUrl}/admin/usuario/${userId}/acceso-mix/${mixId}`, request, {
      headers: this.authService.getAuthHeaders()
    });
  }

  revokeAccess(userId: number, mixId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/usuario/${userId}/acceso-mix/${mixId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Utilidades para archivos
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
