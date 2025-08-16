export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  fechaCreacion: Date;
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

export interface AuthResponse {
  token: string;
  expiration: Date;
  usuario: Usuario;
}

export interface ChangePasswordRequest {
  contraseñaActual: string;
  nuevaContraseña: string;
}

export interface ForgotPasswordRequest {
  email: string;
}
