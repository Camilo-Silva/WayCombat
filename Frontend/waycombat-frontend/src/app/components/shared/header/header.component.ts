import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { Usuario } from '../../../models/auth.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLoggedIn = false;
  currentUser: Usuario | null = null;
  isAdmin = false;
  isNavbarCollapsed = true;
  isUserMenuOpen = false;
  isMenuOpen = false; // Para el icono hamburguesa animado

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    // Suscribirse al estado de autenticación
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isLoggedIn = !!user;
        this.isAdmin = this.authService.isAdmin();
      });

    // Suscribirse a cambios de ruta para cerrar el menú móvil
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.closeNavbar();
        this.closeUserMenu();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleNavbar(): void {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
    this.isMenuOpen = !this.isNavbarCollapsed; // Sincronizar con el estado del icono
  }

  closeNavbar(): void {
    this.isNavbarCollapsed = true;
    this.isMenuOpen = false; // Resetear el estado del icono
  }

  onNavLinkClick(): void {
    // Método específico para cerrar el menú al hacer clic en un enlace
    this.closeNavbar();
  }

  toggleUserMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
    
    // Cerrar el menú cuando se hace clic fuera (solo en el navegador)
    if (this.isUserMenuOpen && isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.document.addEventListener('click', this.closeUserMenu.bind(this));
      });
    }
  }

  private closeUserMenu(): void {
    this.isUserMenuOpen = false;
    // Solo ejecutar en el navegador, no en SSR
    if (isPlatformBrowser(this.platformId)) {
      this.document.removeEventListener('click', this.closeUserMenu.bind(this));
    }
  }

  navigateToAdmin(event: Event): void {
    event.preventDefault();
    this.isUserMenuOpen = false;
    // Navegar al panel de administración
    this.router.navigate(['/admin-dashboard']);
  }

  logout(event: Event): void {
    event.preventDefault();
    this.isUserMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
