import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IGearItem } from '../models/gear-item.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<IGearItem[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`).pipe(
      map(rows => (rows || []).map(row => this.mapApiProduct(row)))
    );
  }

  getProductById(id: number): Observable<IGearItem | undefined> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`).pipe(
      map(row => (row ? this.mapApiProduct(row) : undefined))
    );
  }

  private mapApiProduct(row: any): IGearItem {
    return {
      id: Number(row?.id),
      name: String(row?.name || ''),
      type: String(row?.category || row?.type || ''),
      description: String(row?.description || ''),
      price: Number(row?.price || 0),
      stock: Number(row?.stock || 0),
      badge: row?.badge || undefined,
      image: String(row?.image || ''),
      activity: undefined,
      capacity: row?.capacity ? Number(row.capacity) : undefined
    };
  }
}
