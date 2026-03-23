import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminCustomer {
  id: number;
  name: string;
  email: string;
  phone_number?: string | null;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminCustomersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  listCustomers(): Observable<AdminCustomer[]> {
    return this.http.get<AdminCustomer[]>(`${this.apiUrl}/admin/customers`, {
      headers: this.authHeaders()
    });
  }
}

