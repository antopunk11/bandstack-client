import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  
  // Ajusta la URL si usas environment.ts
  private readonly API_URL = environment.apiUrl;

  getProducts(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/products`);
  }

  getVariants(productId: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/variants?product_id=${productId}`);
  }

  createProduct(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/products`, data);
  }

  createVariant(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/variants`, data);
  }

  updateProduct(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/products`, { id, ...data });
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/products?id=${id}`);
  }

  addStockMovement(data: { variant_id: number; type: string; quantity: number; notes?: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/stock-movements`, data);
  }
}