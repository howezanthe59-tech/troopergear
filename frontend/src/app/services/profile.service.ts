import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MeResponse {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone_number?: string | null;
  created_at?: string;
}

export interface UpdateMePayload {
  name: string;
  email: string;
  phone_number?: string | null;
}

export interface Address {
  id: number;
  street_address: string;
  city: string;
  parish_state: string;
  country: string;
  postal_code?: string | null;
  is_default: number;
  created_at?: string;
  updated_at?: string;
}

export interface AddressPayload {
  street_address: string;
  city: string;
  parish_state: string;
  country: string;
  postal_code?: string | null;
  is_default?: boolean;
}

export interface PaymentMethod {
  id: number;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  holder_name?: string | null;
  token: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePaymentMethodPayload {
  cardNumber: string;
  holder_name?: string | null;
  exp_month: number;
  exp_year: number;
}

export interface UpdatePaymentMethodPayload {
  holder_name?: string | null;
  exp_month: number;
  exp_year: number;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/auth/me`, { headers: this.authHeaders() });
  }

  updateMe(payload: UpdateMePayload): Observable<{ message: string; user: MeResponse }> {
    return this.http.put<{ message: string; user: MeResponse }>(`${this.apiUrl}/profile/me`, payload, {
      headers: this.authHeaders()
    });
  }

  updatePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/profile/password`, { currentPassword, newPassword }, {
      headers: this.authHeaders()
    });
  }

  listAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/profile/addresses`, { headers: this.authHeaders() });
  }

  createAddress(payload: AddressPayload): Observable<Address> {
    return this.http.post<Address>(`${this.apiUrl}/profile/addresses`, payload, { headers: this.authHeaders() });
  }

  updateAddress(id: number, payload: AddressPayload): Observable<Address> {
    return this.http.put<Address>(`${this.apiUrl}/profile/addresses/${id}`, payload, { headers: this.authHeaders() });
  }

  deleteAddress(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/profile/addresses/${id}`, { headers: this.authHeaders() });
  }

  listPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/profile/payment-methods`, { headers: this.authHeaders() });
  }

  createPaymentMethod(payload: CreatePaymentMethodPayload): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(`${this.apiUrl}/profile/payment-methods`, payload, { headers: this.authHeaders() });
  }

  updatePaymentMethod(id: number, payload: UpdatePaymentMethodPayload): Observable<PaymentMethod> {
    return this.http.put<PaymentMethod>(`${this.apiUrl}/profile/payment-methods/${id}`, payload, { headers: this.authHeaders() });
  }

  deletePaymentMethod(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/profile/payment-methods/${id}`, { headers: this.authHeaders() });
  }
}
