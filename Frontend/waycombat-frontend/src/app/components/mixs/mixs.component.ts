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
    this.checkAuthAndLoadMixs();
  }

  private async checkAuthAndLoadMixs(): Promise<void> {
    this.isAuthenticated = await this.authService.isLoggedIn();

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
        // En caso de error, mostrar array vacío
        this.userMixs = [];
        this.isLoading = false;
      }
    });
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
