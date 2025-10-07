export interface Usuario {
  id: string; // UUID de Supabase
  codigo: string; // Código legible: "USR-001", "USR-002", etc.
  nombre: string;
  email: string;
  rol: string;
  fechaCreacion: Date;
  activo: boolean; // Campo para desactivar/activar usuarios
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  contraseña: string;
}

export interface LoginRequest {
  email: string;
  contraseña: string;
}

// AuthResponse ya no es necesario con Supabase Auth
// La sesión se maneja automáticamente por Supabase
export interface AuthResponse {
  usuario: Usuario;
}

export interface ChangePasswordRequest {
  contraseñaActual: string;
  nuevaContraseña: string;
}

export interface ForgotPasswordRequest {
  email: string;
}
