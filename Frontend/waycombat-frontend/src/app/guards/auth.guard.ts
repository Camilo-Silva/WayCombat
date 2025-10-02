import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = await authService.isLoggedIn();
  
  if (isLoggedIn) {
    return true;
  }

  // Redirigir al login si no está autenticado
  router.navigate(['/acceso-instructores'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};
