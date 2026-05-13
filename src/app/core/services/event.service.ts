import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  getEvents(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/events`);
  }

  createEvent(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/events`, data);
  }

  updateEvent(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/events`, { id, ...data });
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/events?id=${id}`);
  }

  closeEvent(eventId: number): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/events/close`, { event_id: eventId });
  }

  getEventSummary(eventId: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/events/summary?event_id=${eventId}`);
  }

    getGlobalSummary() {
    return this.http.get<any>(`${this.API_URL}/events/summary?event_id=global`);
  }

}