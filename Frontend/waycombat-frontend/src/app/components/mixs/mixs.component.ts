import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MixService } from '../../services/mix.service';
import { Mix, ArchivoMix } from '../../models/mix.models';

@Component({
  selector: 'app-mixs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mixs.component.html',
  styleUrl: './mixs.component.css'
})
export class MixsComponent implements OnInit {
  private authService = inject(AuthService);
  private mixService = inject(MixService);
  private router = inject(Router);

  isAuthenticated: boolean = false;
  isLoading: boolean = false;
  userMixs: Mix[] = [];
  currentFile: ArchivoMix | null = null;

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isLoggedIn();
    
    if (this.isAuthenticated) {
      this.loadUserMixs();
    }
  }

  private loadUserMixs(): void {
    this.isLoading = true;
    
    // Cargar solo los mixs del usuario autenticado
    this.mixService.getMisMixes().subscribe({
      next: (mixs) => {
        console.log('=== DEBUG CARGA MIXS DEL USUARIO ===');
        console.log('Mixs del usuario recibidos del backend:', mixs);
        console.log('Cantidad de mixs del usuario:', mixs.length);
        mixs.forEach((mix, index) => {
          console.log(`Mix ${index}:`, {
            id: mix.id,
            titulo: mix.titulo,
            tipoId: typeof mix.id
          });
        });
        this.userMixs = mixs;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando mixs:', error);
        // Fallback a datos mock si hay error
        this.loadMockData();
        this.isLoading = false;
      }
    });
  }

  private loadMockData(): void {
    // Datos de prueba con URLs reales de Google Drive
    this.userMixs = [
      {
        id: 1,
        titulo: 'MIX 1 - Test Real',
        descripcion: 'Mix de prueba con archivos reales de Google Drive y YouTube Music',
        fechaCreacion: new Date(),
        activo: true,
        archivos: [
          { 
            id: 1, 
            mixId: 1,
            nombre: 'track1.mp3', 
            url: 'https://drive.google.com/file/d/1HmRJahcntpMR_HPTQW6uXphWQ6nNVaM_/view?usp=drive_link',
            tipo: 'Audio',
            mimeType: 'audio/mpeg',
            tamañoBytes: 5242880,
            orden: 1,
            activo: true,
            fechaCreacion: new Date()
          },
          { 
            id: 2, 
            mixId: 1,
            nombre: 'track1.mp4', 
            url: 'https://drive.google.com/file/d/1L3nPL5dTTmTIsVPHqPTcg_hToCTD0Eyv/view?usp=drive_link',
            tipo: 'Video',
            mimeType: 'video/mp4',
            tamañoBytes: 104857600,
            orden: 2,
            activo: true,
            fechaCreacion: new Date()
          },
          { 
            id: 3, 
            mixId: 1,
            nombre: 'Técnicas_Way_Combat_YouTube', 
            url: 'https://music.youtube.com/watch?v=-grPV-Fae6I&list=OLAK5uy_ljWDekJVUfMOYniqd1mZ8l45Q2nAwk4ds',
            tipo: 'Video',
            mimeType: 'video/youtube',
            tamañoBytes: 0,
            orden: 3,
            activo: true,
            fechaCreacion: new Date()
          }
        ]
      }
    ];
  }

  getFileCount(mix: Mix): number {
    return mix.archivos?.filter(archivo => archivo.activo)?.length || 0;
  }

  downloadFile(file: ArchivoMix): void {
    if (file.mimeType === 'video/youtube') {
      // Para videos de YouTube, abrir en nueva pestaña
      window.open(file.url, '_blank');
    } else {
      // Para archivos de Google Drive, convertir URL y descargar
      const downloadUrl = this.convertGoogleDriveUrl(file.url);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.nombre;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private convertGoogleDriveUrl(url: string): string {
    // Convertir URL de Google Drive para descarga directa
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/d/')[1].split('/')[0];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
  }

  playFile(file: ArchivoMix): void {
    this.currentFile = file;
    if (file.tipo === 'Audio') {
      // Implementar reproductor de audio
      console.log('Reproduciendo audio:', file.nombre);
    } else if (file.tipo === 'Video') {
      // Implementar reproductor de video
      console.log('Reproduciendo video:', file.nombre);
    }
  }

  closePlayer(): void {
    this.currentFile = null;
  }

  isAudio(fileName: string): boolean {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
    return audioExtensions.some(ext => fileName.toLowerCase().includes(ext));
  }

  isVideo(fileName: string): boolean {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
    return videoExtensions.some(ext => fileName.toLowerCase().includes(ext)) || 
           fileName.toLowerCase().includes('youtube');
  }

  verMix(mixId: number): void {
    console.log('=== DEBUG NAVEGACIÓN ===');
    console.log('verMix llamado con mixId:', mixId);
    console.log('Tipo de mixId:', typeof mixId);
    console.log('mixId válido?', mixId && mixId > 0);
    console.log('Ruta a navegar:', `/mixs/${mixId}`);
    
    if (mixId && mixId > 0) {
      console.log('Navegando a:', ['/mixs', mixId]);
      this.router.navigate(['/mixs', mixId]).then(
        (success) => console.log('Navegación exitosa:', success),
        (error) => console.error('Error en navegación:', error)
      );
    } else {
      console.error('ID de mix inválido:', mixId);
    }
  }
}
