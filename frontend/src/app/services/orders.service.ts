import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MyOrder {
  id: number;
  user_id: number;
  status: string;
  total: number;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  myOrders(): Observable<MyOrder[]> {
    return this.http.get<MyOrder[]>(`${this.apiUrl}/orders`, {
      headers: this.authHeaders()
    });
  }
}

