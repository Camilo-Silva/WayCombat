import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, firstValueFrom, catchError, of } from 'rxjs';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  Usuario, 
  ChangePasswordRequest,
  ForgotPasswordRequest 
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5165/api'; // URL de la API
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Verificar si hay un usuario logueado al iniciar
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    if (!this.isBrowser) {
      return; // No ejecutar en el servidor
    }

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('currentUser');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    }
  }

  async register(request: RegisterRequest): Promise<{ success: boolean; message?: string; data?: AuthResponse }> {
    try {
      // Convertir propiedades a formato esperado por el backend
      const backendRequest = {
        Nombre: request.nombre,
        Email: request.email,
        Contraseña: request.contraseña
      };

      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, backendRequest)
          .pipe(
            tap(response => this.handleAuthSuccess(response)),
            catchError(error => {
              console.error('Register error:', error);
              throw error;
            })
          )
      );
      return { success: true, data: response };
    } catch (error: any) {
      const message = error?.error?.message || error?.error || 'Error al registrar usuario';
      return { success: false, message };
    }
  }

  async login(request: LoginRequest): Promise<{ success: boolean; message?: string; data?: AuthResponse }> {
    try {
      // Convertir propiedades a formato esperado por el backend
      const backendRequest = {
        Email: request.email,
        Contraseña: request.contraseña
      };

      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, backendRequest)
          .pipe(
            tap(response => this.handleAuthSuccess(response)),
            catchError(error => {
              console.error('Login error:', error);
              throw error;
            })
          )
      );
      return { success: true, data: response };
    } catch (error: any) {
      const message = error?.error?.message || error?.error || 'Credenciales inválidas';
      return { success: false, message };
    }
  }

  logout(): void {
    if (!this.isBrowser) {
      return; // No ejecutar en el servidor
    }

    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tokenExpiration');
    this.currentUserSubject.next(null);
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<{ success: boolean; message?: string }> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/auth/forgot-password`, request)
      );
      return { success: true, message: 'Email enviado correctamente' };
    } catch (error: any) {
      const message = error?.error?.message || 'Error al enviar email de recuperación';
      return { success: false, message };
    }
  }

  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuario/cambiar-contraseña`, request, {
      headers: this.getAuthHeaders()
    });
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    if (!this.isBrowser) {
      return null; // No hay token en el servidor
    }
    return localStorage.getItem('token');
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.rol || null;
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) {
      return false; // No está logueado en el servidor
    }

    const token = this.getToken();
    const expiration = localStorage.getItem('tokenExpiration');
    
    if (!token || !expiration) {
      return false;
    }

    const expirationDate = new Date(expiration);
    if (expirationDate <= new Date()) {
      this.logout();
      return false;
    }

    return true;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.rol?.toLowerCase() === 'admin';
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  private handleAuthSuccess(response: AuthResponse): void {
    if (!this.isBrowser) {
      return; // No guardar en localStorage en el servidor
    }

    localStorage.setItem('token', response.token);
    localStorage.setItem('currentUser', JSON.stringify(response.usuario));
    localStorage.setItem('tokenExpiration', response.expiration.toString());
    this.currentUserSubject.next(response.usuario);
  }
}
