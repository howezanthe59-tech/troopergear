import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IWishlistItem {
  id: number;
  product_id: number;
  name: string;
  category: string;
  price: number;
  image?: string;
  badge?: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  getWishlist(): Observable<IWishlistItem[]> {
    return this.http.get<IWishlistItem[]>(`${this.apiUrl}/wishlist`, {
      headers: this.authHeaders()
    });
  }

  addItem(productId: number): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(
      `${this.apiUrl}/wishlist/items`,
      { productId },
      { headers: this.authHeaders() }
    );
  }

  removeItem(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/wishlist/items/${id}`, {
      headers: this.authHeaders()
    });
  }

  clearWishlist(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/wishlist/clear`, {}, {
      headers: this.authHeaders()
    });
  }
}
