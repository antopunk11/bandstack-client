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
    return this.http.put<any>(`${this.API_URL}/expenses`, { id, ...data });
  }
}