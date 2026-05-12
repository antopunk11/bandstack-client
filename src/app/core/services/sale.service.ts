import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  createSale(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/sales`, data);
  }
}