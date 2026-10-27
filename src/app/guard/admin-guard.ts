import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Session } from '../auth/session/session';

export const adminGuard: CanActivateFn = (route, state) => {
  let servUsuario = inject(Session)
  let router = inject(Router)

  if(servUsuario.isLoggedIn()){  
    return true;
  }
  return router.createUrlTree(['/login'])
};
