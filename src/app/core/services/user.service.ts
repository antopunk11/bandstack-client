import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  // Ajusta la URL base según cómo tengas configurado tu entorno
  private apiUrl = environment.apiUrl; 

  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, userData);
  }

  updateUser(userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users`, userData);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users?id=${id}`);
  }
}