import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
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

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Suscribirse al estado de autenticación
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isLoggedIn = !!user;
        this.isAdmin = this.authService.isAdmin();
        
        // Debug: Log del estado del usuario
        console.log('Header - Usuario actual:', user);
        console.log('Header - ¿Es admin?:', this.isAdmin);
        console.log('Header - Rol del usuario:', user?.rol);
        console.log('Header - Comparación de rol:', user?.rol?.toLowerCase() === 'admin');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleNavbar(): void {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
  }

  toggleUserMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
    
    // Cerrar el menú cuando se hace clic fuera
    if (this.isUserMenuOpen) {
      setTimeout(() => {
        document.addEventListener('click', this.closeUserMenu.bind(this));
      });
    }
  }

  private closeUserMenu(): void {
    this.isUserMenuOpen = false;
    document.removeEventListener('click', this.closeUserMenu.bind(this));
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
