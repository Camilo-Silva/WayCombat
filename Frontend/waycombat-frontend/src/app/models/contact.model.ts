export interface ContactInfo {
  direccion: string;
  telefono: string;
  email: string;
  horarios: string;
  redes: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
  };
}

export interface FAQ {
  pregunta: string;
  respuesta: string;
  categoria: string;
  expanded?: boolean;
}
