import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-capacitaciones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './capacitaciones.component.html',
  styleUrl: './capacitaciones.component.css'
})
export class CapacitacionesComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private animationService = inject(AnimationService);

  isAuthenticated: boolean = false;

  ngOnInit(): void {
    // Verificar si el usuario está autenticado
    this.isAuthenticated = this.authService.isLoggedIn();
    
    // Inicializar animaciones
    this.animationService.respectMotionPreference();
    
    setTimeout(() => {
      if (this.animationService.isAnimationSupported()) {
        this.animationService.initScrollAnimations();
        this.animationService.initParallax();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.animationService.cleanup();
  }
}
