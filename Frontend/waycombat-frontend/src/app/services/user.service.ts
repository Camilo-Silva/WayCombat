import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/auth.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://localhost:7001/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getMiCuenta(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuario/mi-cuenta`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateProfile(usuario: Usuario): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuario/actualizar-perfil`, usuario, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Métodos para administradores
  getAllUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/admin/usuarios`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getUsuarioById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/admin/usuarios/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
