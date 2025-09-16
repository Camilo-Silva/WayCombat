export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  contraseña: string;
  rol: 'Usuario' | 'Admin';
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface Mix {
  id: number;
  titulo: string;
  descripcion: string;
  archivoUrl: string;
  imagenUrl?: string;
  duracion?: number;
  tamañoBytes?: number;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface AccesoMix {
  id: number;
  usuarioId: number;
  mixId: number;
  fechaAcceso: Date;
  activo: boolean;
}

// DTOs
export interface RegisterDto {
  nombre: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  };
}

export interface CreateMixDto {
  titulo: string;
  descripcion: string;
  archivoUrl: string;
  imagenUrl?: string;
  duracion?: number;
  tamañoBytes?: number;
}