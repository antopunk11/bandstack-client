import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  getExpenses(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/expenses`);
  }

  createExpense(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/expenses`, data);
  }

  updateExpense(id: number, data: any): Observable<any> {
    if (data instanceof FormData) {
      data.append('id', id.toString());
      data.append('_method', 'PUT'); // Trick para que PHP reciba los archivos
      return this.http.post<any>(`${this.API_URL}/expenses`, data);
    }
    return this.http.put<any>(`${this.API_URL}/expenses`, { id, ...data });
  }

  deleteExpense(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/expenses?id=${id}`);
  }
}