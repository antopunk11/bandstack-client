// src/app/core/interceptors/jwt.interceptor.ts
import {
  HttpInterceptorFn, HttpRequest,
  HttpHandlerFn, HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { inject }             from '@angular/core';
import { BehaviorSubject, Observable, throwError, filter, take, switchMap, catchError } from 'rxjs';
import { AuthService }        from '../services/auth.service';

// ----------------------------------------------------------------
// Estado compartido del interceptor (singleton por módulo).
// Gestiona la cola de peticiones mientras se renueva el token.
// ----------------------------------------------------------------
let isRefreshing           = false;
const refreshToken$        = new BehaviorSubject<string | null>(null);

/**
 * JwtInterceptor — Interceptor funcional (Angular 17+)
 *
 * Responsabilidades:
 * 1. Inyectar el header Authorization en todas las peticiones a nuestra API.
 * 2. Al recibir un 401, intentar renovar el access token UNA sola vez.
 * 3. Mientras se renueva, encolar el resto de peticiones fallidas.
 * 4. Una vez renovado, reintentar todas las peticiones encoladas.
 * 5. Si el refresh también falla, el AuthService redirige al login.
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {

  const authService = inject(AuthService);

  // No interceptar peticiones a otras APIs o al propio endpoint de refresh
  if (isPublicRequest(req.url)) {
    return next(req);
  }

  // Clonar la petición añadiendo el Bearer token
  const token = authService.getAccessToken();
  const authReq = token ? addBearerToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {

      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401(req, next, authService);
      }

      return throwError(() => error);
    }),
  );
};

// ---- Helpers privados ----------------------------------------

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
): Observable<HttpEvent<unknown>> {

  if (isRefreshing) {
    // Ya hay un refresh en curso → esperar a que emita el nuevo token
    return refreshToken$.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(addBearerToken(req, token!))),
    );
  }

  // Lanzar el proceso de refresh
  isRefreshing = true;
  refreshToken$.next(null);

  return authService.refreshAccessToken().pipe(
    switchMap(response => {
      isRefreshing = false;
      refreshToken$.next(response.access_token);
      authService.setAccessToken(response.access_token);

      // Reintentar la petición original con el nuevo token
      return next(addBearerToken(req, response.access_token));
    }),
    catchError(err => {
      isRefreshing = false;
      refreshToken$.next(null);
      // AuthService ya redirige al login en refreshAccessToken()
      return throwError(() => err);
    }),
  );
}

function addBearerToken(
  req: HttpRequest<unknown>,
  token: string,
): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

/** Rutas que no necesitan token — ajusta según tu API */
function isPublicRequest(url: string): boolean {
  const publicPaths = ['/auth/login', '/auth/refresh'];
  return publicPaths.some(path => url.includes(path));
}
