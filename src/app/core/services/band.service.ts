import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class BandService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getBands(): Observable<any> {
    return this.http.get(`${this.apiUrl}/bands`);
  }

  createBand(bandData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/bands`, bandData);
  }

  updateBand(bandData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/bands`, bandData);
  }

  deleteBand(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/bands?id=${id}`);
  }
}