import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminProduct {
  id?: number;
  name: string;
  category: string;
  description?: string | null;
  price: number;
  stock: number;
  badge?: string | null;
  image?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminProductService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  list(): Observable<AdminProduct[]> {
    return this.http.get<AdminProduct[]>(`${this.apiUrl}/products`, {
      headers: this.authHeaders()
    });
  }

  create(product: AdminProduct, imageFile?: File | null): Observable<AdminProduct> {
    const body = this.toFormData(product, imageFile);
    return this.http.post<AdminProduct>(`${this.apiUrl}/products`, body, { headers: this.authHeaders() });
  }

  update(id: number, product: Partial<AdminProduct>, imageFile?: File | null): Observable<AdminProduct> {
    const body = this.toFormData(product, imageFile);
    return this.http.put<AdminProduct>(`${this.apiUrl}/products/${id}`, body, { headers: this.authHeaders() });
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/products/${id}`, { headers: this.authHeaders() });
  }

  private toFormData(product: Partial<AdminProduct>, imageFile?: File | null): FormData {
    const form = new FormData();
    const entries: Array<[keyof AdminProduct, any]> = [
      ['name', product.name],
      ['category', product.category],
      ['description', product.description],
      ['price', product.price],
      ['stock', product.stock],
      ['badge', product.badge]
    ];
    for (const [key, value] of entries) {
      if (value === undefined) continue;
      if (value === null) {
        form.append(String(key), '');
        continue;
      }
      form.append(String(key), String(value));
    }
    if (imageFile) {
      form.append('image', imageFile);
    }
    return form;
  }
}
