import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session } from '../auth/session/session';

export const logInGuard: CanActivateFn = (route, state) => {
  const session = inject(Session);
  const router = inject(Router);
  return session.isLoggedIn() ? true : router.createUrlTree(['/login']); //Siempre que no este logeado lo mandamos al login
};
