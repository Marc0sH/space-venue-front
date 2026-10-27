import { CanActivateFn } from '@angular/router';

export const formularioGuard: CanActivateFn = (route, state) => {
  return true;
};
