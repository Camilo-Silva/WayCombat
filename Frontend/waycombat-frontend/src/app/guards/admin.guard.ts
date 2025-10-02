import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = await authService.isLoggedIn();

  if (isLoggedIn && authService.isAdmin()) {
    return true;
  }

  // Redirigir al home si no es admin
  router.navigate(['/']);
  return false;
};
