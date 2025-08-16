import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface Director {
  name: string;
  position: string;
  description: string;
  image?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  benefits: Benefit[] = [
    {
      icon: 'fas fa-fist-raised',
      title: 'Fuerza y Poder',
      description: 'Desarrolla fuerza funcional y poder explosivo con técnicas probadas de combate.'
    },
    {
      icon: 'fas fa-heart',
      title: 'Cardio Intenso',
      description: 'Mejora tu resistencia cardiovascular con entrenamientos dinámicos y desafiantes.'
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'Defensa Personal',
      description: 'Aprende técnicas reales de defensa personal aplicables en situaciones cotidianas.'
    },
    {
      icon: 'fas fa-brain',
      title: 'Disciplina Mental',
      description: 'Fortalece tu mente, mejora la concentración y desarrolla confianza personal.'
    },
    {
      icon: 'fas fa-users',
      title: 'Comunidad',
      description: 'Únete a una comunidad apasionada de personas con objetivos similares.'
    },
    {
      icon: 'fas fa-trophy',
      title: 'Resultados',
      description: 'Logra transformaciones reales con nuestro sistema de entrenamiento estructurado.'
    },
    {
      icon: 'fas fa-dumbbell',
      title: 'Flexibilidad',
      description: 'Mejora tu movilidad y flexibilidad con ejercicios específicos de combate.'
    },
    {
      icon: 'fas fa-clock',
      title: 'Eficiencia',
      description: 'Maximiza tu tiempo con entrenamientos intensos y altamente efectivos.'
    }
  ];

  directors: Director[] = [
    {
      name: 'Fede Ramirez',
      position: 'Director Técnico y Fundador',
      description: 'Con más de 15 años de experiencia en artes marciales mixtas y entrenamiento deportivo. Especialista en técnicas de combate modernas.'
    },
    {
      name: 'Isa Ramirez Pujol',
      position: 'Directora de Programas',
      description: 'Experta en desarrollo de programas de fitness funcional. Certificada en múltiples disciplinas de combate y preparación física.'
    }
  ];
}
