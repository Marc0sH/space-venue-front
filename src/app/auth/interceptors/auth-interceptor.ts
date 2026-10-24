import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Session } from '../user/session';
import { environment } from '../../../environments/enviroment';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

//Este interceptor manda la info de la sesion para las peticiones donde es necesaria
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(Session);
  const session = sessionService.session();
  

  //No mando headers en las request que no lo precisan
  if (!session || !req.url.startsWith(environment.apiUrl) || req.url.startsWith(`${environment.apiUrl}/auth`)) {
    return next(req);
  }

  const authReq = req.clone({ //Clono el request original y lo devuelvo con un header agregado de la sesion
    setHeaders: { Authorization: `${session.tipo} ${session.token}` }
  });


  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) { //Si vencio el token o no esta deslogea al ususario y lo manda a login
        sessionService.logoutUser();
      }
      return throwError(() => err);
    })
  );

}
