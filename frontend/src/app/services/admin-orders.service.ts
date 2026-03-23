import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminOrder {
  id: number;
  user_id: number;
  status: string;
  total: number;
  created_at: string;
  user_name?: string;
  user_email?: string;
  items_purchased?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  listAll(): Observable<AdminOrder[]> {
    return this.http.get<AdminOrder[]>(`${this.apiUrl}/orders/admin/all`, {
      headers: this.authHeaders()
    });
  }
}

