import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IGearItem, CartItem, CartVariant } from '../models/gear-item.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItems.asObservable();

  private apiUrl = 'http://localhost:3000/api/cart';

  constructor(private http: HttpClient) {}

  loadCart(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap(rows => {
        const mapped: CartItem[] = (rows || []).map(row => ({
          id: row.id,
          quantity: row.quantity,
          variant: {
            color: row.variant_color || undefined,
            size: row.variant_size || undefined
          },
          gearData: {
            id: row.product_id,
            name: row.name,
            type: row.category,
            price: row.price,
            image: row.image,
            badge: row.badge,
            description: ''
          } as IGearItem
        }));

        this.cartItems.next(mapped);
      })
    );
  }

  addItem(product: IGearItem, variant?: CartVariant, quantity: number = 1): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/items`, {
      productId: product.id,
      quantity,
      variantColor: variant?.color || null,
      variantSize: variant?.size || null
    }).pipe(
      tap(() => this.loadCart().subscribe())
    );
  }

  decrementItem(cartItemId: number, currentQuantity: number): Observable<any> {
    if (currentQuantity <= 1) {
      return this.removeItem(cartItemId);
    }

    return this.http.put<any>(`${this.apiUrl}/items/${cartItemId}`, {
      quantity: currentQuantity - 1
    }).pipe(
      tap(() => this.loadCart().subscribe())
    );
  }

  updateItem(cartItemId: number, quantity: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/items/${cartItemId}`, {
      quantity
    }).pipe(
      tap(() => this.loadCart().subscribe())
    );
  }

  removeItem(cartItemId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/items/${cartItemId}`).pipe(
      tap(() => this.loadCart().subscribe())
    );
  }

  clearCart(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clear`, {}).pipe(
      tap(() => this.cartItems.next([]))
    );
  }

  getItems(): CartItem[] {
    return this.cartItems.getValue();
  }

  getTotal(): number {
    return this.cartItems.getValue()
      .reduce((sum, i) => sum + this.getItemPrice(i) * i.quantity, 0);
  }

  getItemPrice(item: CartItem): number {
    if (item.gearData.name === 'TrailBeam Flashlight') {
      return item.variant?.size === 'Small' ? 19.99 : 24.99;
    }
    return item.gearData.price;
  }
}
