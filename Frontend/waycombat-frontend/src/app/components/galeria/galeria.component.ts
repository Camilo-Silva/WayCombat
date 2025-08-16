import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GalleryItem {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: 'imagen' | 'video';
  categoria: 'entrenamientos' | 'jornada-waycombat' | 'eventos';
  url: string;
  thumbnail?: string;
  fecha: Date;
  visualizaciones: number;
  favorito: boolean;
  descargable: boolean;
  tags?: string[];
}

@Component({
  selector: 'app-galeria',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galeria.component.html',
  styleUrl: './galeria.component.css'
})
export class GaleriaComponent implements OnInit {
  selectedFilter: string = 'todos';
  isLoading: boolean = true;
  selectedItem: GalleryItem | null = null;
  
  // Datos mock de la galería
  galleryItems: GalleryItem[] = [
    {
      id: 1,
      titulo: 'Entrenamiento de Boxeo - Clase Avanzada',
      descripcion: 'Sesión intensiva de boxeo con técnicas avanzadas de combinaciones y trabajo de saco.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/gallery/boxing-training-1.jpg',
      fecha: new Date('2024-12-01'),
      visualizaciones: 245,
      favorito: false,
      descargable: true,
      tags: ['boxeo', 'avanzado', 'técnica']
    },
    {
      id: 2,
      titulo: 'Jornada WayCombat - Evento Principal',
      descripcion: 'Jornada especial WayCombat con demostraciones y competencias.',
      tipo: 'video',
      categoria: 'jornada-waycombat',
      url: 'assets/videos/gallery/jornada-waycombat.mp4',
      thumbnail: 'assets/images/gallery/jornada-waycombat-thumb.jpg',
      fecha: new Date('2024-11-15'),
      visualizaciones: 1205,
      favorito: true,
      descargable: false,
      tags: ['jornada', 'waycombat', 'especial']
    },
    {
      id: 3,
      titulo: 'Seminario de Defensa Personal',
      descripcion: 'Taller especializado en técnicas de autodefensa para situaciones de emergencia.',
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/gallery/self-defense-seminar.jpg',
      fecha: new Date('2024-11-30'),
      visualizaciones: 156,
      favorito: false,
      descargable: true,
      tags: ['defensa-personal', 'seminario', 'autodefensa']
    },
    {
      id: 4,
      titulo: 'Entrenamiento de MMA - Ground Game',
      descripcion: 'Práctica de técnicas de suelo y submissions en nuestro dojo principal.',
      tipo: 'video',
      categoria: 'entrenamientos',
      url: 'assets/videos/gallery/mma-ground-game.mp4',
      thumbnail: 'assets/images/gallery/mma-ground-thumb.jpg',
      fecha: new Date('2024-12-05'),
      visualizaciones: 892,
      favorito: false,
      descargable: false,
      tags: ['mma', 'ground-game', 'submissions']
    },
    {
      id: 5,
      titulo: 'Jornada WayCombat - Torneo Juvenil',
      descripcion: 'Competencia especial para jóvenes en la Jornada WayCombat.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/gallery/jornada-juvenil.jpg',
      fecha: new Date('2024-10-20'),
      visualizaciones: 678,
      favorito: true,
      descargable: true,
      tags: ['jornada', 'juvenil', 'torneo']
    },
    {
      id: 6,
      titulo: 'Entrenamiento de Muay Thai',
      descripcion: 'Clase de Muay Thai enfocada en técnicas de codo y rodilla.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/gallery/muay-thai-training.jpg',
      fecha: new Date('2024-12-10'),
      visualizaciones: 432,
      favorito: false,
      descargable: true,
      tags: ['muay-thai', 'técnicas', 'entrenamiento']
    },
    {
      id: 7,
      titulo: 'Evento de Graduación',
      descripcion: 'Ceremonia de graduación de nuevos instructores certificados.',
      tipo: 'video',
      categoria: 'eventos',
      url: 'assets/videos/gallery/graduation-ceremony.mp4',
      thumbnail: 'assets/images/gallery/graduation-thumb.jpg',
      fecha: new Date('2024-11-01'),
      visualizaciones: 1500,
      favorito: true,
      descargable: false,
      tags: ['graduación', 'certificación', 'instructores']
    },
    {
      id: 8,
      titulo: 'Jornada WayCombat - Demostraciones',
      descripcion: 'Demostraciones de técnicas por instructores expertos.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/gallery/jornada-demos.jpg',
      fecha: new Date('2024-09-15'),
      visualizaciones: 890,
      favorito: false,
      descargable: true,
      tags: ['demostraciones', 'técnicas', 'instructores']
    },
    {
      id: 9,
      titulo: 'Entrenamiento de Kickboxing',
      descripcion: 'Sesión de kickboxing con enfoque en combinaciones de piernas.',
      tipo: 'video',
      categoria: 'entrenamientos',
      url: 'assets/videos/gallery/kickboxing-session.mp4',
      thumbnail: 'assets/images/gallery/kickboxing-thumb.jpg',
      fecha: new Date('2024-12-08'),
      visualizaciones: 567,
      favorito: false,
      descargable: false,
      tags: ['kickboxing', 'piernas', 'combinaciones']
    }
  ];

  filteredItems: GalleryItem[] = [];

  ngOnInit(): void {
    this.loadGallery();
  }

  private loadGallery(): void {
    this.isLoading = true;
    
    // Simular carga
    setTimeout(() => {
      this.filteredItems = [...this.galleryItems];
      this.isLoading = false;
    }, 500);
  }

  filterGallery(filter: string): void {
    this.selectedFilter = filter;
    
    if (filter === 'todos') {
      this.filteredItems = [...this.galleryItems];
    } else {
      this.filteredItems = this.galleryItems.filter(item => item.categoria === filter);
    }
  }

  getCategoryLabel(categoria: string): string {
    switch (categoria) {
      case 'entrenamientos':
        return 'Entrenamiento';
      case 'jornada-waycombat':
        return 'Jornada WayCombat';
      case 'eventos':
        return 'Eventos';
      default:
        return categoria;
    }
  }

  getCategoryBadgeClass(categoria: string): string {
    switch (categoria) {
      case 'entrenamientos':
        return 'bg-primary text-white';
      case 'jornada-waycombat':
        return 'bg-warning text-dark';
      case 'eventos':
        return 'bg-success text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  openModal(item: GalleryItem): void {
    this.selectedItem = item;
    // Aquí se abriría el modal de Bootstrap
    console.log('Opening modal for:', item.titulo);
  }

  downloadItem(item: GalleryItem): void {
    console.log('Downloading:', item.titulo);
    // Lógica para descargar el archivo
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.titulo;
    link.click();
  }
}
