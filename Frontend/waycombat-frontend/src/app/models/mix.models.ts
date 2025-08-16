export interface Mix {
  id: number;
  titulo: string;
  descripcion?: string;
  fechaCreacion: Date;
  activo: boolean;
  archivos: ArchivoMix[];
}

export interface ArchivoMix {
  id: number;
  mixId: number;
  tipo: string; // "Audio", "Video", "Imagen"
  nombre: string;
  url: string;
  mimeType?: string;
  tamañoBytes?: number;
  orden: number;
  activo: boolean;
  fechaCreacion: Date;
}

export interface CreateMixRequest {
  titulo: string;
  descripcion?: string;
}

export interface UpdateMixRequest {
  titulo: string;
  descripcion?: string;
  activo: boolean;
}

export interface CreateArchivoMixRequest {
  tipo: string;
  nombre: string;
  url: string;
  mimeType?: string;
  tamañoBytes?: number;
  orden?: number;
}

export interface AccesoMix {
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

export interface CreateAccesoMixRequest {
  usuarioId: number;
  mixId: number;
  fechaExpiracion?: Date;
}
