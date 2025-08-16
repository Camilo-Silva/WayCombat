/* 
 * INSTRUCCIONES PARA CONFIGURAR URLs REALES
 * =========================================
 * 
 * Para Google Drive:
 * 1. Sube tu archivo a Google Drive
 * 2. Haz clic derecho → "Obtener enlace"
 * 3. Cambia permisos a "Cualquier persona con el enlace"
 * 4. Copia el ID del archivo (la parte entre /d/ y /view en la URL)
 * 5. Reemplaza en el formato: https://drive.google.com/uc?export=download&id=TU_ID_AQUI
 * 
 * Para YouTube:
 * 1. Usa cualquier URL de YouTube válida
 * 2. El sistema detectará automáticamente si es YouTube y mostrará el embed
 * 
 * Ejemplos de URLs de prueba que funcionan:
 * - Google Drive: https://drive.google.com/uc?export=download&id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
 * - YouTube: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 */

// URLs DE EJEMPLO - REEMPLAZA CON TUS ARCHIVOS REALES
export const SAMPLE_URLS = {
  // Audio files (MP3)
  TRACK_1: 'https://drive.google.com/uc?export=download&id=TU_ID_DE_AUDIO_1',
  TRACK_2: 'https://drive.google.com/uc?export=download&id=TU_ID_DE_AUDIO_2', 
  TRACK_3: 'https://drive.google.com/uc?export=download&id=TU_ID_DE_AUDIO_3',
  
  // Video files (MP4)
  VIDEO_1: 'https://drive.google.com/uc?export=download&id=TU_ID_DE_VIDEO_1',
  VIDEO_2: 'https://drive.google.com/uc?export=download&id=TU_ID_DE_VIDEO_2',
  
  // YouTube videos
  YOUTUBE_TUTORIAL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  YOUTUBE_DEMO: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
  YOUTUBE_CARDIO: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
};
