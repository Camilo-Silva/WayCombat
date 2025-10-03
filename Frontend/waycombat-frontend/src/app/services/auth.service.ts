import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Usuario,
  ChangePasswordRequest,
  ForgotPasswordRequest
} from '../models/auth.models';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private supabase: SupabaseService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Inicializar usuario desde Supabase Auth
    if (this.isBrowser) {
      this.initializeUser().catch(err => {
        console.error('Error en initializeUser:', err);
        // Asegurarse de que el observable emita null para desbloquear la UI
        this.currentUserSubject.next(null);
      });
    } else {
      // En SSR, emitir null inmediatamente
      this.currentUserSubject.next(null);
    }
  }

  private async initializeUser(): Promise<void> {
    try {
      console.log('🔍 AuthService: Inicializando usuario...');
      const { data: { user }, error } = await this.supabase.client.auth.getUser();

      if (error) {
        console.error('❌ Error obteniendo usuario de Supabase:', error);
        this.currentUserSubject.next(null);
        return;
      }

      if (user) {
        console.log('✅ Usuario encontrado en Supabase:', user.id);
        await this.loadUserProfile(user.id);
      } else {
        console.log('ℹ️ No hay usuario autenticado');
        this.currentUserSubject.next(null);
      }
    } catch (error) {
      console.error('❌ Error initializing user:', error);
      this.currentUserSubject.next(null);
    }
  }

  private async loadUserProfile(userId: string): Promise<void> {
    try {
      // 1. Obtener datos del usuario
      const { data, error } = await this.supabase.client
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      if (data) {
        // 2. Obtener rol activo desde user_roles
        const { data: roleData } = await this.supabase.client
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('active', true)
          .order('granted_at', { ascending: false })
          .limit(1)
          .single();

        const usuario: Usuario = {
          id: data.id,
          nombre: data.nombre,
          email: data.email,
          rol: roleData?.role || data.rol || 'usuario', // Prioridad: user_roles > usuarios.rol > default
          fechaCreacion: new Date(data.fecha_creacion),
          activo: data.activo
        };

        console.log('✅ Usuario cargado con rol:', usuario.rol);
        this.currentUserSubject.next(usuario);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async register(request: RegisterRequest): Promise<{ success: boolean; message?: string; data?: AuthResponse }> {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await this.supabase.client.auth.signUp({
        email: request.email,
        password: request.contraseña,
        options: {
          data: {
            nombre: request.nombre
          }
        }
      });

      if (authError) {
        return { success: false, message: authError.message };
      }

      if (!authData.user) {
        return { success: false, message: 'Error al crear usuario' };
      }

      // 2. Crear perfil en tabla usuarios
      const { data: profileData, error: profileError } = await this.supabase.client
        .from('usuarios')
        .insert({
          id: authData.user.id,
          nombre: request.nombre,
          email: request.email,
          rol: 'usuario', // Minúscula para coincidir con constraint
          activo: true,
          fecha_creacion: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return { success: false, message: 'Error al crear perfil de usuario' };
      }

      const usuario: Usuario = {
        id: profileData.id,
        nombre: profileData.nombre,
        email: profileData.email,
        rol: profileData.rol,
        fechaCreacion: new Date(profileData.fecha_creacion),
        activo: profileData.activo
      };

      this.currentUserSubject.next(usuario);
      return { success: true, data: { usuario } };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Error al registrar usuario' };
    }
  }

  async login(request: LoginRequest): Promise<{ success: boolean; message?: string; data?: AuthResponse }> {
    try {
      const { data, error } = await this.supabase.client.auth.signInWithPassword({
        email: request.email,
        password: request.contraseña
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (!data.user) {
        return { success: false, message: 'Credenciales inválidas' };
      }

      // Cargar perfil del usuario
      await this.loadUserProfile(data.user.id);
      const usuario = this.currentUserSubject.value;

      if (!usuario) {
        return { success: false, message: 'Error al cargar perfil de usuario' };
      }

      // Verificar si el usuario está activo
      if (!usuario.activo) {
        await this.logout();
        return { success: false, message: 'Usuario desactivado. Contacte al administrador.' };
      }

      return { success: true, data: { usuario } };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Error al iniciar sesión' };
    }
  }

  async logout(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      await this.supabase.client.auth.signOut();
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await this.supabase.client.auth.resetPasswordForEmail(request.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Email enviado correctamente' };
    } catch (error: any) {
      const message = error?.message || 'Error al enviar email de recuperación';
      return { success: false, message };
    }
  }

  async changePassword(request: ChangePasswordRequest): Promise<{ success: boolean; message?: string }> {
    try {
      // Primero verificar la contraseña actual intentando re-autenticar
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'Usuario no autenticado' };
      }

      // Verificar contraseña actual
      const { error: signInError } = await this.supabase.client.auth.signInWithPassword({
        email: currentUser.email,
        password: request.contraseñaActual
      });

      if (signInError) {
        return { success: false, message: 'Contraseña actual incorrecta' };
      }

      // Cambiar a la nueva contraseña
      const { error: updateError } = await this.supabase.client.auth.updateUser({
        password: request.nuevaContraseña
      });

      if (updateError) {
        return { success: false, message: updateError.message };
      }

      return { success: true, message: 'Contraseña actualizada correctamente' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Error al cambiar contraseña' };
    }
  }

  async updateProfile(usuario: Usuario): Promise<{ success: boolean; message?: string; data?: Usuario }> {
    try {
      const { data, error } = await this.supabase.client
        .from('usuarios')
        .update({
          nombre: usuario.nombre,
          email: usuario.email
        })
        .eq('id', usuario.id)
        .select()
        .single();

      if (error) {
        return { success: false, message: error.message };
      }

      // Si el email cambió, actualizar también en Supabase Auth
      if (data.email !== usuario.email) {
        const { error: authError } = await this.supabase.client.auth.updateUser({
          email: usuario.email
        });

        if (authError) {
          return { success: false, message: 'Error al actualizar email en autenticación' };
        }
      }

      const updatedUsuario: Usuario = {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        fechaCreacion: new Date(data.fecha_creacion),
        activo: data.activo
      };

      this.currentUserSubject.next(updatedUsuario);
      return { success: true, data: updatedUsuario };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Error al actualizar perfil' };
    }
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  async getToken(): Promise<string | null> {
    if (!this.isBrowser) {
      return null;
    }

    const { data: { session } } = await this.supabase.client.auth.getSession();
    return session?.access_token || null;
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.rol || null;
  }

  async isLoggedIn(): Promise<boolean> {
    if (!this.isBrowser) {
      return false;
    }

    const { data: { session } } = await this.supabase.client.auth.getSession();
    return !!session;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.rol?.toLowerCase() === 'admin';
  }
}
