import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MixService } from '../../services/mix.service';
import { Mix, ArchivoMix } from '../../models/mix.models';

@Component({
  selector: 'app-mix-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mix-detalle.component.html',
  styleUrl: './mix-detalle.component.css'
})
export class MixDetalleComponent implements OnInit {
  
  mix: Mix | null = null;
  isLoading = true;
  activeTab = 'audios';

  // Función para convertir URLs de Google Drive de vista a descarga directa
  private convertGoogleDriveUrl(url: string): string {
    // Si es una URL de Google Drive con /view, convertirla a descarga directa
    if (url.includes('drive.google.com/file/d/') && url.includes('/view')) {
      const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }
    return url;
  }

  // Función para convertir URLs de Google Drive a embed
  private convertGoogleDriveToEmbed(url: string): string {
    if (url.includes('drive.google.com/file/d/') && url.includes('/view')) {
      const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return url;
  }

  // Método para obtener URL embed de Google Drive
  getGoogleDriveEmbedUrl(archivo: ArchivoMix): SafeResourceUrl {
    const embedUrl = this.convertGoogleDriveToEmbed(archivo.url);
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  // Propiedades computadas para el template
  get audioFiles(): ArchivoMix[] {
    return this.getAudios();
  }

  get videoFiles(): ArchivoMix[] {
    return this.getVideos();
  }

  get totalFiles(): number {
    return this.getTotalFiles();
  }

  // Datos de ejemplo actualizados con contenido real
  private mockMixes: Mix[] = [
    {
      id: 1,
      titulo: 'MIX 1',
      descripcion: 'Primer mix de entrenamiento Way Combat',
      fechaCreacion: new Date(),
      activo: true,
      archivos: [
        { 
          id: 1, 
          mixId: 1,
          nombre: 'Way_Combat_Track1.mp3', 
          url: 'https://drive.google.com/uc?export=download&id=TU_ID_REAL_AQUI',
          tipo: 'Audio',
          mimeType: 'audio/mpeg',
          tamañoBytes: 8388608,
          orden: 1,
          activo: true,
          fechaCreacion: new Date()
        },
        { 
          id: 2, 
          mixId: 1,
          nombre: 'Way_Combat_Track2.mp3', 
          url: 'https://drive.google.com/uc?export=download&id=TU_ID_REAL_AQUI_2',
          tipo: 'Audio',
          mimeType: 'audio/mpeg',
          tamañoBytes: 7340032,
          orden: 2,
          activo: true,
          fechaCreacion: new Date()
        }
      ]
    },
    {
      id: 2,
      titulo: 'MIX 2',
      descripcion: 'Segundo mix con técnicas avanzadas',
      fechaCreacion: new Date(),
      activo: true,
      archivos: [
        { 
          id: 3, 
          mixId: 2,
          nombre: 'Advanced_Training.mp3', 
          url: 'https://drive.google.com/uc?export=download&id=TU_ID_REAL_AQUI_3',
          tipo: 'Audio',
          mimeType: 'audio/mpeg',
          tamañoBytes: 9437184,
          orden: 1,
          activo: true,
          fechaCreacion: new Date()
        }
      ]
    },
    {
      id: 3,
      titulo: 'MIX 3',
      descripcion: 'Mix de calentamiento y estiramiento',
      fechaCreacion: new Date(),
      activo: true,
      archivos: [
        { 
          id: 4, 
          mixId: 3,
          nombre: 'Warmup_Session.mp3', 
          url: 'https://drive.google.com/uc?export=download&id=TU_ID_REAL_AQUI_4',
          tipo: 'Audio',
          mimeType: 'audio/mpeg',
          tamañoBytes: 6291456,
          orden: 1,
          activo: true,
          fechaCreacion: new Date()
        },
        { 
          id: 5, 
          mixId: 3,
          nombre: 'Stretching_Guide.mp4', 
          url: 'https://drive.google.com/uc?export=download&id=TU_ID_REAL_AQUI_5',
          tipo: 'Video',
          mimeType: 'video/mp4',
          tamañoBytes: 104857600,
          orden: 2,
          activo: true,
          fechaCreacion: new Date()
        }
      ]
    },
    {
      id: 4,
      titulo: 'MIX 4',
      descripcion: 'Mix completo con archivos de audio y video de entrenamiento',
      fechaCreacion: new Date(),
      activo: true,
      archivos: [
        { 
          id: 9, 
          mixId: 4,
          nombre: 'Way_Combat_Track1.mp3', 
          url: 'https://drive.google.com/uc?export=download&id=TU_ID_REAL_AQUI',
          tipo: 'Audio',
          mimeType: 'audio/mpeg',
          tamañoBytes: 8388608,
          orden: 1,
          activo: true,
          fechaCreacion: new Date()
        },
        { 
          id: 10, 
          mixId: 4,
          nombre: 'Way_Combat_Video.mp4', 
          url: 'https://drive.google.com/file/d/1L3nPL5dTTmTIsVPHqPTcg_hToCTD0Eyv/view?usp=drive_link',
          tipo: 'Video',
          mimeType: 'video/mp4',
          tamañoBytes: 104857600,
          orden: 2,
          activo: true,
          fechaCreacion: new Date()
        }
      ]
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mixService: MixService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const mixId = parseInt(params['id']);
      this.loadMix(mixId);
    });
  }

  loadMix(id: number): void {
    this.isLoading = true;
    
    // Cargar desde el backend
    this.mixService.getMixById(id).subscribe({
      next: (mix) => {
        this.mix = mix;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando mix:', error);
        // Fallback a datos mock si hay error
        this.mix = this.mockMixes.find(m => m.id === id) || null;
        this.isLoading = false;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getAudios(): ArchivoMix[] {
    if (!this.mix) return [];
    return this.mix.archivos.filter(archivo => 
      archivo.tipo && archivo.tipo.toLowerCase() === 'audio' && archivo.activo
    );
  }

  getVideos(): ArchivoMix[] {
    if (!this.mix) return [];
    return this.mix.archivos.filter(archivo => 
      archivo.tipo && archivo.tipo.toLowerCase() === 'video' && archivo.activo
    );
  }

  // Método para obtener URL procesada para reproductores HTML
  getPlayableUrl(archivo: ArchivoMix): string {
    return this.convertGoogleDriveUrl(archivo.url);
  }

  getTotalFiles(): number {
    if (!this.mix) return 0;
    return this.mix.archivos.filter(archivo => archivo.activo).length;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  downloadFile(archivo: ArchivoMix): void {
    // Para archivos de Google Drive, usar URL convertida para descarga
    const downloadUrl = this.convertGoogleDriveUrl(archivo.url);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = archivo.nombre;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadAllFiles(): void {
    if (!this.mix) return;

    const activeFiles = this.mix.archivos.filter(archivo => archivo.activo);
    
    if (activeFiles.length === 0) {
      alert('No hay archivos disponibles para descargar.');
      return;
    }

    // Descargar archivos uno por uno con un pequeño delay
    activeFiles.forEach((archivo, index) => {
      setTimeout(() => {
        this.downloadFile(archivo);
      }, index * 1000); // 1 segundo de delay entre descargas
    });
  }

  downloadAllAudios(): void {
    const audios = this.getAudios();
    if (audios.length === 0) {
      alert('No hay archivos de audio disponibles para descargar.');
      return;
    }

    audios.forEach((audio, index) => {
      setTimeout(() => {
        this.downloadFile(audio);
      }, index * 1000);
    });
  }

  downloadAllVideos(): void {
    const videos = this.getVideos();
    if (videos.length === 0) {
      alert('No hay archivos de video disponibles para descargar.');
      return;
    }

    videos.forEach((video, index) => {
      setTimeout(() => {
        this.downloadFile(video);
      }, index * 1000);
    });
  }

  openFile(archivo: ArchivoMix): void {
    this.downloadFile(archivo);
  }

  isGoogleDriveUrl(url: string): boolean {
    return url.includes('drive.google.com/file/d/');
  }

  goBack(): void {
    this.router.navigate(['/mixs']);
  }
}
