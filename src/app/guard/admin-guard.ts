import { CanActivateFn, Router } from '@angular/router';
import { Session } from '../user/session';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
  let servUsuario = inject(Session)
  let router = inject(Router)

  if(servUsuario.logIn()){  
    return true;
  }

  return router.createUrlTree(['/login'])
};
