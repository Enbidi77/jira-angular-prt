import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() || auth.user()) {
    return true;
  }

  // Not authenticated, redirect to login
  return router.createUrlTree(['/login']);
};

export const unauthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() || auth.user()) {
    return router.createUrlTree(['/workspaces']);
  }

  return true;
};
