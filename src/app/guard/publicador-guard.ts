import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Session } from '../auth/session/session';

//Rutas de creación y gestión de espacios propios: solo ADMIN y OFFERER (oferente)
export const publicadorGuard: CanActivateFn = (route, state) => {
  const session = inject(Session);
  const router = inject(Router);

  if (session.puedePublicar()) {
    return true;
  }
  //Si está logueado pero es cliente lo mandamos a la lista, si no al login
  return router.createUrlTree([session.isLoggedIn() ? '/espacios' : '/login']);
};
