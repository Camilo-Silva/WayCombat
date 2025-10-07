import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio principal de Supabase
 * Inicializa y gestiona el cliente de Supabase
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor() {
    console.log('🚀 SupabaseService: Inicializando...');
    console.log('📍 Supabase URL:', environment.supabase.url);

    // Inicializar cliente de Supabase con configuración para evitar lock timeout
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          // Aumentar timeout para evitar NavigatorLockAcquireTimeoutError
          // Útil cuando hay múltiples pestañas abiertas
          storageKey: 'sb-auth-token',
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          // Configuración de lock para evitar timeouts
          flowType: 'pkce'
        }
      }
    );

    console.log('✅ SupabaseService: Cliente inicializado');

    // Verificar sesión actual al iniciar
    this.checkSession();

    // Escuchar cambios en el estado de autenticación
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event);
      this.currentUserSubject.next(session?.user ?? null);
    });
  }

  /**
   * Obtiene el cliente de Supabase
   */
  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Verifica si hay una sesión activa
   */
  private async checkSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.currentUserSubject.next(session?.user ?? null);
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtiene el ID del usuario actual
   */
  getCurrentUserId(): string | null {
    return this.currentUserSubject.value?.id ?? null;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }
}
