// src/app/core/guards/auth.guard.ts
import { inject }      from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole }    from '../models/auth.models';

// ----------------------------------------------------------------
// authGuard — protege rutas que requieren estar autenticado.
//
// Flujo:
//   1. ¿Hay access token en memoria? → permitir paso.
//   2. ¿Hay refresh token en localStorage? → intentar renovar.
//   3. Nada válido → redirigir a /login con queryParam returnUrl.
// ----------------------------------------------------------------
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Guardar la URL a la que el usuario quería acceder para redirigir
  // después del login.
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

// ----------------------------------------------------------------
// roleGuard — protege rutas que requieren un rol concreto.
//
// Uso en routes:
//   canActivate: [authGuard, roleGuard],
//   data: { roles: ['admin'] }
// ----------------------------------------------------------------
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService  = inject(AuthService);
  const router       = inject(Router);
  const allowedRoles = (route.data?.['roles'] ?? []) as UserRole[];

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (allowedRoles.length === 0 || authService.hasRole(...allowedRoles)) {
    return true;
  }

  // Autenticado pero sin el rol requerido → página de acceso denegado
  return router.createUrlTree(['/forbidden']);
};
