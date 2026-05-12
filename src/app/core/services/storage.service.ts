// src/app/core/services/storage.service.ts
import { Injectable } from '@angular/core';

const KEYS = {
  REFRESH_TOKEN: 'bs_refresh_token',
  USER:          'bs_user',
} as const;

/**
 * Abstrae el acceso a localStorage para facilitar el testing
 * y centralizar el manejo de errores de serialización.
 * El access token NO se persiste aquí; vive solo en memoria (AuthService).
 */
@Injectable({ providedIn: 'root' })
export class StorageService {

  saveRefreshToken(token: string): void {
    localStorage.setItem(KEYS.REFRESH_TOKEN, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  }

  saveUser(user: object): void {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  }

  getUser<T>(): T | null {
    try {
      const raw = localStorage.getItem(KEYS.USER);
      return raw ? JSON.parse(raw) as T : null;
    } catch {
      return null;
    }
  }

  clearAll(): void {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
  }
}
