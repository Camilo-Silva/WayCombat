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
      url: 'assets/images/12.jpg',
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
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/8.jpg',
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
      url: 'assets/images/33.jpg',
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
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/7.jpg',
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
      url: 'assets/images/19.jpg',
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
      url: 'assets/images/3.jpg',
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
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/40.jpg',
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
      url: 'assets/images/15.jpg',
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
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/28.jpg',
      fecha: new Date('2024-12-08'),
      visualizaciones: 567,
      favorito: false,
      descargable: false,
      tags: ['kickboxing', 'piernas', 'combinaciones']
    },
    {
      id: 10,
      titulo: 'Competencia Nacional de Combat',
      descripcion: 'Participación en el campeonato nacional de artes marciales mixtas.',
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/2.jpg',
      fecha: new Date('2024-12-15'),
      visualizaciones: 1340,
      favorito: true,
      descargable: true,
      tags: ['competencia', 'nacional', 'mma']
    },
    {
      id: 11,
      titulo: 'Jornada WayCombat - Exhibición',
      descripcion: 'Exhibición especial de técnicas tradicionales y modernas.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/36.jpg',
      fecha: new Date('2024-08-10'),
      visualizaciones: 523,
      favorito: false,
      descargable: true,
      tags: ['exhibición', 'técnicas', 'tradición']
    },
    {
      id: 12,
      titulo: 'Entrenamiento de Jiu-Jitsu',
      descripcion: 'Clase avanzada de Brazilian Jiu-Jitsu con técnicas de control.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/14.jpg',
      fecha: new Date('2024-12-20'),
      visualizaciones: 687,
      favorito: false,
      descargable: true,
      tags: ['jiu-jitsu', 'control', 'brasileño']
    },
    {
      id: 13,
      titulo: 'Workshop de Acondicionamiento',
      descripcion: 'Taller especializado en preparación física para combate.',
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/22.jpg',
      fecha: new Date('2024-11-25'),
      visualizaciones: 445,
      favorito: false,
      descargable: false,
      tags: ['acondicionamiento', 'físico', 'workshop']
    },
    {
      id: 14,
      titulo: 'Jornada WayCombat - Maestros',
      descripcion: 'Encuentro especial con maestros internacionales invitados.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/5.jpg',
      fecha: new Date('2024-07-30'),
      visualizaciones: 2100,
      favorito: true,
      descargable: true,
      tags: ['maestros', 'internacional', 'encuentro']
    },
    {
      id: 15,
      titulo: 'Entrenamiento de Karate',
      descripcion: 'Práctica de kata y kumite en el dojo tradicional.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/38.jpg',
      fecha: new Date('2024-12-18'),
      visualizaciones: 334,
      favorito: false,
      descargable: true,
      tags: ['karate', 'kata', 'kumite']
    },
    {
      id: 16,
      titulo: 'Seminario de Nutrición Deportiva',
      descripcion: 'Charla educativa sobre alimentación para atletas de combate.',
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/11.jpg',
      fecha: new Date('2024-10-05'),
      visualizaciones: 267,
      favorito: false,
      descargable: false,
      tags: ['nutrición', 'deportiva', 'atletas']
    },
    {
      id: 17,
      titulo: 'Jornada WayCombat - Principiantes',
      descripcion: 'Clase especial de introducción para nuevos estudiantes.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/26.jpg',
      fecha: new Date('2024-09-20'),
      visualizaciones: 789,
      favorito: true,
      descargable: true,
      tags: ['principiantes', 'introducción', 'nuevos']
    },
    {
      id: 18,
      titulo: 'Entrenamiento de Taekwondo',
      descripcion: 'Sesión enfocada en técnicas de patadas altas y acrobáticas.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/44.jpg',
      fecha: new Date('2024-12-12'),
      visualizaciones: 456,
      favorito: false,
      descargable: true,
      tags: ['taekwondo', 'patadas', 'acrobático']
    },
    {
      id: 19,
      titulo: 'Conferencia de Filosofía Marcial',
      descripcion: 'Charla sobre los aspectos mentales y espirituales de las artes marciales.',
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/17.jpg',
      fecha: new Date('2024-08-15'),
      visualizaciones: 198,
      favorito: false,
      descargable: false,
      tags: ['filosofía', 'mental', 'espiritual']
    },
    {
      id: 20,
      titulo: 'Jornada WayCombat - Veteranos',
      descripcion: 'Homenaje a los veteranos y fundadores de la academia.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/31.jpg',
      fecha: new Date('2024-06-10'),
      visualizaciones: 1567,
      favorito: true,
      descargable: true,
      tags: ['veteranos', 'fundadores', 'homenaje']
    },
    {
      id: 21,
      titulo: 'Entrenamiento de Capoeira',
      descripcion: 'Clase de capoeira con música tradicional brasileña.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/9.jpg',
      fecha: new Date('2024-12-22'),
      visualizaciones: 612,
      favorito: false,
      descargable: true,
      tags: ['capoeira', 'música', 'brasileña']
    },
    {
      id: 22,
      titulo: 'Torneo Interno de Sparring',
      descripcion: 'Competencia amistosa entre estudiantes de diferentes niveles.',
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/38.jpg',
      fecha: new Date('2024-11-18'),
      visualizaciones: 934,
      favorito: true,
      descargable: false,
      tags: ['torneo', 'sparring', 'interno']
    },
    {
      id: 23,
      titulo: 'Jornada WayCombat - Mujeres',
      descripcion: 'Evento especial dedicado a la participación femenina en el combate.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/23.jpg',
      fecha: new Date('2024-03-08'),
      visualizaciones: 1223,
      favorito: true,
      descargable: true,
      tags: ['mujeres', 'femenino', 'especial']
    },
    {
      id: 24,
      titulo: 'Entrenamiento de Krav Maga',
      descripcion: 'Técnicas de defensa personal militar aplicadas al civil.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/43.jpg',
      fecha: new Date('2024-12-25'),
      visualizaciones: 723,
      favorito: false,
      descargable: true,
      tags: ['krav-maga', 'militar', 'defensa']
    },
    {
      id: 25,
      titulo: 'Expo Artes Marciales',
      descripcion: 'Participación en la exposición anual de artes marciales de la ciudad.',
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/16.jpg',
      fecha: new Date('2024-05-20'),
      visualizaciones: 1789,
      favorito: true,
      descargable: false,
      tags: ['expo', 'ciudad', 'anual']
    },
    {
      id: 26,
      titulo: 'Jornada WayCombat - Niños',
      descripcion: 'Programa especial de introducción a las artes marciales para niños.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/34.jpg',
      fecha: new Date('2024-04-15'),
      visualizaciones: 856,
      favorito: false,
      descargable: true,
      tags: ['niños', 'introducción', 'programa']
    },
    {
      id: 27,
      titulo: 'Entrenamiento de Aikido',
      descripcion: 'Práctica de técnicas de redirección y control sin violencia.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/1.jpg',
      fecha: new Date('2024-12-28'),
      visualizaciones: 378,
      favorito: false,
      descargable: true,
      tags: ['aikido', 'redirección', 'control']
    },
    {
      id: 28,
      titulo: 'Congreso Internacional de Combat',
      descripcion: 'Participación en el congreso mundial de artes marciales modernas.',
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/29.jpg',
      fecha: new Date('2024-02-28'),
      visualizaciones: 2345,
      favorito: true,
      descargable: false,
      tags: ['congreso', 'internacional', 'mundial']
    },
    {
      id: 29,
      titulo: 'Jornada WayCombat - Graduación',
      descripcion: 'Ceremonia especial de graduación de cinturones avanzados.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/13.jpg',
      fecha: new Date('2024-12-30'),
      visualizaciones: 1456,
      favorito: true,
      descargable: true,
      tags: ['graduación', 'cinturones', 'avanzados']
    },
    {
      id: 30,
      titulo: 'Entrenamiento de Wing Chun',
      descripcion: 'Técnicas de combate a corta distancia y chi sao.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/45.jpg',
      fecha: new Date('2024-12-26'),
      visualizaciones: 234,
      favorito: false,
      descargable: true,
      tags: ['wing-chun', 'corta-distancia', 'chi-sao']
    },
    {
      id: 31,
      titulo: 'Festival de Artes Marciales',
      descripcion: 'Celebración anual del festival cultural de artes marciales.',
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/20.jpg',
      fecha: new Date('2024-01-15'),
      visualizaciones: 1678,
      favorito: true,
      descargable: false,
      tags: ['festival', 'cultural', 'celebración']
    },
    {
      id: 32,
      titulo: 'Jornada WayCombat - Equipos',
      descripcion: 'Competencia por equipos entre diferentes academias.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/37.jpg',
      fecha: new Date('2024-11-05'),
      visualizaciones: 967,
      favorito: false,
      descargable: true,
      tags: ['equipos', 'academias', 'competencia']
    },
    {
      id: 33,
      titulo: 'Entrenamiento de Escrima',
      descripcion: 'Artes marciales filipinas con bastones y armas tradicionales.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/6.jpg',
      fecha: new Date('2024-12-29'),
      visualizaciones: 445,
      favorito: false,
      descargable: true,
      tags: ['escrima', 'filipinas', 'bastones']
    },
    {
      id: 34,
      titulo: 'Seminario de Primeros Auxilios',
      descripcion: 'Capacitación en primeros auxilios específicos para deportes de contacto.',
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/25.jpg',
      fecha: new Date('2024-07-10'),
      visualizaciones: 356,
      favorito: false,
      descargable: false,
      tags: ['primeros-auxilios', 'contacto', 'capacitación']
    },
    {
      id: 35,
      titulo: 'Jornada WayCombat - Masters',
      descripcion: 'Encuentro exclusivo para instructores y maestros certificados.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/40.jpg',
      fecha: new Date('2024-05-05'),
      visualizaciones: 1834,
      favorito: true,
      descargable: true,
      tags: ['masters', 'instructores', 'certificados']
    },
    {
      id: 36,
      titulo: 'Entrenamiento de Sambo',
      descripcion: 'Arte marcial ruso combinando judo y lucha libre.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/18.jpg',
      fecha: new Date('2024-12-31'),
      visualizaciones: 567,
      favorito: false,
      descargable: true,
      tags: ['sambo', 'ruso', 'judo']
    },
    {
      id: 37,
      titulo: 'Clínica de Arbitraje',
      descripcion: 'Formación para nuevos árbitros en competencias de combate.',
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/32.jpg',
      fecha: new Date('2024-09-10'),
      visualizaciones: 123,
      favorito: false,
      descargable: false,
      tags: ['arbitraje', 'árbitros', 'formación']
    },
    {
      id: 38,
      titulo: 'Jornada WayCombat - Aniversario',
      descripcion: 'Celebración del 10º aniversario de la academia WayCombat.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/10.jpg',
      fecha: new Date('2024-06-20'),
      visualizaciones: 2567,
      favorito: true,
      descargable: true,
      tags: ['aniversario', '10años', 'celebración']
    },
    {
      id: 39,
      titulo: 'Entrenamiento de Hapkido',
      descripcion: 'Arte marcial coreano enfocado en técnicas de agarre y proyección.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/43.jpg',
      fecha: new Date('2024-12-27'),
      visualizaciones: 289,
      favorito: false,
      descargable: true,
      tags: ['hapkido', 'coreano', 'proyección']
    },
    {
      id: 40,
      titulo: 'Campamento de Verano',
      descripcion: 'Campamento intensivo de verano para jóvenes atletas.',
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/21.jpg',
      fecha: new Date('2024-01-20'),
      visualizaciones: 1234,
      favorito: true,
      descargable: false,
      tags: ['campamento', 'verano', 'jóvenes']
    },
    {
      id: 41,
      titulo: 'Jornada WayCombat - Internacional',
      descripcion: 'Intercambio cultural con academias internacionales.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/35.jpg',
      fecha: new Date('2024-08-25'),
      visualizaciones: 1890,
      favorito: true,
      descargable: true,
      tags: ['internacional', 'intercambio', 'cultural']
    },
    {
      id: 42,
      titulo: 'Entrenamiento de Luta Livre',
      descripcion: 'Arte marcial brasileño de lucha libre sin gi.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/4.jpg',
      fecha: new Date('2024-12-24'),
      visualizaciones: 378,
      favorito: false,
      descargable: true,
      tags: ['luta-livre', 'brasileño', 'sin-gi']
    },
    {
      id: 43,
      titulo: 'Mesa Redonda de Instructores',
      descripcion: 'Debate y discusión sobre metodologías de enseñanza.',
      tipo: 'imagen',
      categoria: 'eventos',
      url: 'assets/images/27.jpg',
      fecha: new Date('2024-04-30'),
      visualizaciones: 445,
      favorito: false,
      descargable: false,
      tags: ['mesa-redonda', 'metodología', 'enseñanza']
    },
    {
      id: 44,
      titulo: 'Jornada WayCombat - Clausura',
      descripcion: 'Evento de clausura del año académico 2024.',
      tipo: 'imagen',
      categoria: 'jornada-waycombat',
      url: 'assets/images/30.jpg',
      fecha: new Date('2024-12-15'),
      visualizaciones: 1445,
      favorito: true,
      descargable: true,
      tags: ['clausura', 'académico', '2024']
    },
    {
      id: 45,
      titulo: 'Entrenamiento Funcional Combat',
      descripcion: 'Preparación física específica para atletas de combate.',
      tipo: 'imagen',
      categoria: 'entrenamientos',
      url: 'assets/images/24.jpg',
      fecha: new Date('2024-12-23'),
      visualizaciones: 656,
      favorito: false,
      descargable: true,
      tags: ['funcional', 'físico', 'atletas']
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
