import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

export const roleGuard = (roles: string[]): CanActivateFn => {
  return () => {
    const session = inject(SessionService);
    const router = inject(Router);
    if (session.role && roles.includes(session.role)) return true;
    return router.createUrlTree(['/auth/login']);
  };
};
