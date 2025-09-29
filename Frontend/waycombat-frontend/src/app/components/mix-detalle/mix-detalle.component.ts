import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MixService } from '../../services/mix.service';
import { Mix, ArchivoMix } from '../../models/mix.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mix-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mix-detalle.component.html',
  styleUrl: './mix-detalle.component.css'
})
export class MixDetalleComponent implements OnInit, OnDestroy {
  
  mix: Mix | null = null;
  isLoading = true;
  activeTab = 'audios';
  
  // Cache para URLs sanitizadas - ESTO PREVIENE RE-RENDERIZADO
  private urlCache = new Map<string, SafeResourceUrl>();
  private subscription: Subscription = new Subscription();

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

  // Método para obtener URL embed de Google Drive CON CACHE
  getGoogleDriveEmbedUrl(archivo: ArchivoMix): SafeResourceUrl {
    // Usar cache para evitar re-renderizado de iframes
    const cacheKey = `embed_${archivo.id}_${archivo.url}`;
    
    if (this.urlCache.has(cacheKey)) {
      return this.urlCache.get(cacheKey)!;
    }
    
    const embedUrl = this.convertGoogleDriveToEmbed(archivo.url);
    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    
    // Guardar en cache
    this.urlCache.set(cacheKey, safeUrl);
    
    return safeUrl;
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mixService: MixService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Suscribirse a cambios de parámetros con cache
    this.subscription.add(
      this.route.params.subscribe(params => {
        const mixId = parseInt(params['id']);
        this.loadMix(mixId);
      })
    );
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones y cache
    this.subscription.unsubscribe();
    this.urlCache.clear();
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
        // En caso de error, mostrar que no se encontró el mix
        this.mix = null;
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

  // TrackBy function para prevenir re-renderizado de iframes
  trackByArchivoId(index: number, archivo: ArchivoMix): number {
    return archivo.id;
  }

  // Método para generar un ID único y estable para cada iframe
  getIframeId(archivo: ArchivoMix): string {
    return `iframe-${archivo.tipo?.toLowerCase()}-${archivo.id}`;
  }

  goBack(): void {
    this.router.navigate(['/mixs']);
  }
}
