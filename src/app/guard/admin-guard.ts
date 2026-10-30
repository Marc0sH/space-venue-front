import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Session } from '../auth/session/session';

export const adminGuard: CanActivateFn = (route, state) => {
  let servUsuario = inject(Session)
  let router = inject(Router)

  if(servUsuario.isAdmin()){
    return true;
  }
  //Si está logueado pero no es admin lo mandamos a la lista, si no al login
  return router.createUrlTree([servUsuario.isLoggedIn() ? '/espacios' : '/login'])
};
