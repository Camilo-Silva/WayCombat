import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private observers: Map<string, IntersectionObserver> = new Map();

  constructor() {}

  /**
   * Inicializa el observer para animaciones en scroll
   */
  initScrollAnimations(): void {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '0px 0px -100px 0px', // Activa cuando el elemento está 100px desde el bottom
      threshold: 0.1 // Se activa cuando el 10% del elemento es visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.classList.add('visible');
        }
      });
    }, options);

    // Observar todos los elementos con clases de animación
    const animatedElements = document.querySelectorAll('[class*="animate-"]');
    animatedElements.forEach(element => {
      observer.observe(element);
    });

    this.observers.set('scroll', observer);
  }

  /**
   * Anima múltiples elementos con delay progresivo
   */
  animateStaggered(selector: string, delay: number = 100): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('visible');
      }, index * delay);
    });
  }

  /**
   * Aplica efecto parallax suave a elementos
   */
  initParallax(): void {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.parallax-element');
      
      parallaxElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        const speed = parseFloat(htmlElement.dataset['speed'] || '0.5');
        const yPos = -(scrolled * speed);
        htmlElement.style.transform = `translateY(${yPos}px)`;
      });
    });
  }

  /**
   * Anima el contador de números
   */
  animateCounter(element: HTMLElement, finalValue: number, duration: number = 2000): void {
    let startValue = 0;
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function para suavidad
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (finalValue - startValue) * easeOutQuart);
      
      element.textContent = currentValue.toString();
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }

  /**
   * Efecto typewriter para textos
   */
  typewriterEffect(element: HTMLElement, text: string, speed: number = 50): void {
    element.textContent = '';
    let i = 0;
    
    const typeWriter = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
      }
    };
    
    typeWriter();
  }

  /**
   * Revela elementos con efecto de "draw" para líneas SVG
   */
  drawLineEffect(element: SVGPathElement): void {
    const length = element.getTotalLength();
    element.style.strokeDasharray = length + '';
    element.style.strokeDashoffset = length + '';
    
    element.style.animation = 'draw 2s ease-in-out forwards';
  }

  /**
   * Limpia todos los observers
   */
  cleanup(): void {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
  }

  /**
   * Verifica si las animaciones están soportadas
   */
  isAnimationSupported(): boolean {
    return 'IntersectionObserver' in window && 
           'requestAnimationFrame' in window &&
           CSS.supports('transform', 'translateX(0px)');
  }

  /**
   * Aplica configuración de reducción de movimiento si está activada
   */
  respectMotionPreference(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const style = document.createElement('style');
      style.textContent = `
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
