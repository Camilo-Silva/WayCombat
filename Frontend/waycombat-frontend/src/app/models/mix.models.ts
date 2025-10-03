export interface Mix {
  id: string; // UUID
  titulo: string;
  descripcion?: string;
  fechaCreacion: Date;
  activo: boolean;
  archivos: ArchivoMix[];
}

export interface ArchivoMix {
  id: string; // UUID
  mixId: string; // UUID
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
  archivos?: UpdateArchivoMixRequest[];
}

export interface UpdateArchivoMixRequest {
  id?: string | number; // ✅ Opcional: UUID para archivos existentes, undefined/null para nuevos
  tipo: string;
  nombre: string;
  url: string;
  mimeType?: string;
  tamañoBytes?: number;
  orden: number;
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
  id: string; // UUID
  usuarioId: string; // UUID
  mixId: string; // UUID
  nombreUsuario: string;
  emailUsuario: string;
  tituloMix: string;
  fechaAcceso: Date;
  fechaExpiracion?: Date;
  activo: boolean;
}

export interface CreateAccesoMixRequest {
  usuarioId: string; // UUID
  mixId: string; // UUID
  fechaExpiracion?: Date;
}
