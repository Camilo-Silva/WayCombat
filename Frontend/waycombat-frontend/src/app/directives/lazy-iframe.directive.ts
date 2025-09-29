import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appLazyIframe]',
  standalone: true
})
export class LazyIframeDirective implements OnInit, OnDestroy {
  @Input() appLazyIframe: string = '';

  private observer?: IntersectionObserver;
  private isLoaded = false;

  constructor(private el: ElementRef<HTMLIFrameElement>) {}

  ngOnInit() {
    // Solo cargar cuando el iframe esté visible
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isLoaded) {
          this.loadIframe();
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private loadIframe() {
    if (this.isLoaded) return;

    const iframe = this.el.nativeElement;
    if (this.appLazyIframe) {
      iframe.src = this.appLazyIframe;
      this.isLoaded = true;

      // Detener la observación una vez cargado
      if (this.observer) {
        this.observer.unobserve(iframe);
      }
    }
  }
}
