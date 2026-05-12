// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors }                            from '@angular/common/http';
import { inject }                                                          from '@angular/core';
import { routes }                                                          from './app.routes';
import { jwtInterceptor }                                                  from './core/interceptors/jwt.interceptor';
import { AuthService }                                                     from './core/services/auth.service';
import { StorageService }                                                  from './core/services/storage.service';
import { catchError, of }                                                  from 'rxjs';

// ----------------------------------------------------------------
// APP_INITIALIZER: al arrancar la app, si hay un refresh token en
// localStorage intentamos obtener un access token nuevo y cargar
// el perfil del usuario. Así la sesión persiste tras F5.
// ----------------------------------------------------------------
function initializeAuth(auth: AuthService, storage: StorageService) {
  return () => {
    // Sin refresh token no hay sesión que restaurar
    if (!storage.getRefreshToken()) return of(null);

    return auth
      .refreshAccessToken()
      .pipe(
        // Si el refresh falla (token expirado) simplemente arrancamos sin sesión
        catchError(() => of(null)),
      );
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideRouter(
      routes,
      withComponentInputBinding(),   // Permite @Input() desde params de ruta
      withViewTransitions(),         // Transiciones de vista nativas (Chrome 111+)
    ),

    provideHttpClient(
      withInterceptors([jwtInterceptor]),
    ),

    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const auth    = inject(AuthService);
        const storage = inject(StorageService);
        return initializeAuth(auth, storage);
      },
      multi: true,
    },
  ],
};
