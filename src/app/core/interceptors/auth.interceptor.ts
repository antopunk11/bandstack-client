import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, catchError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  let authReq = req;
  
  // Inyectar el token en las cabeceras si existe
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el token expiró (401) y no estamos intentando hacer login ni refrescar
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
        
        return authService.refreshToken().pipe(
          switchMap((newToken: string) => {
            // Reintentar la petición original con el nuevo token
            const clonedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            });
            return next(clonedReq);
          }),
          catchError((refreshError) => {
            // Si falla el refresh, cerramos sesión
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};