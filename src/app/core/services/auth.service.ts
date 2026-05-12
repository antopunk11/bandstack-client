import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { UserRole, User } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // Señal reactiva para el usuario actual
  user$: WritableSignal<User | null> = signal(null);

  private readonly API_URL = `${environment.apiUrl}/auth`;

  constructor() {
    // Cargar el usuario inicial si existe en el almacenamiento local
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        this.user$.set(JSON.parse(userStr));
      } catch (e) {
        console.error('Error al recuperar el usuario de localStorage', e);
      }
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  setAccessToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this.user$();
    if (!user) return false;
    
    return roles.includes(user.role);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setAccessToken(res.data.access_token);
          localStorage.setItem('refresh_token', res.data.refresh_token);
          if (res.data.user) {
            localStorage.setItem('current_user', JSON.stringify(res.data.user));
            this.user$.set(res.data.user);
          }
        }
      })
    );
  }

  refreshAccessToken(): Observable<any> {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<any>(`${this.API_URL}/refresh`, { refresh_token: refresh }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setAccessToken(res.data.access_token);
          localStorage.setItem('refresh_token', res.data.refresh_token);
          if (res.data.user) {
            localStorage.setItem('current_user', JSON.stringify(res.data.user));
            this.user$.set(res.data.user);
          }
        }
      }),
      map(res => res.data)
    );
  }

  // Mantenemos este alias en caso de que alguna parte de tu código lo use
  refreshToken(): Observable<string> {
    return this.refreshAccessToken().pipe(map(data => data.access_token));
  }

  logout(): void {
    localStorage.clear(); // O borra individualmente los tokens y datos
    this.user$.set(null); // Resetea la señal reactiva del usuario
    this.router.navigate(['/login']);
  }
}