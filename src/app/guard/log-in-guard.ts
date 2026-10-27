import { CanActivateFn } from '@angular/router';

export const logInGuard: CanActivateFn = (route, state) => {
  return true;
};
