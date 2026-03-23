import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IGearItem, CartItem, CartVariant } from '../models/gear-item.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItems.asObservable();

  constructor() { }

  addItem(product: IGearItem, variant?: CartVariant) {
    const current = this.cartItems.getValue();
    const existingItem = current.find(
      i => i.gearData.id === product.id && this.isSameVariant(i.variant, variant)
    );

    if (existingItem) {
      existingItem.quantity++;
      this.cartItems.next([...current]);
    } else {
      this.cartItems.next([...current, { gearData: product, quantity: 1, variant }]);
    }
  }

  decrementItem(productId: number, variant?: CartVariant) {
    const current = this.cartItems.getValue();
    const existing = current.find(
      i => i.gearData.id === productId && this.isSameVariant(i.variant, variant)
    );
    if (existing && existing.quantity > 1) {
      existing.quantity--;
      this.cartItems.next([...current]);
    } else {
      this.removeItem(productId, variant);
    }
  }

  removeItem(productId: number, variant?: CartVariant) {
    const updated = this.cartItems.getValue()
      .filter(i => !(i.gearData.id === productId && this.isSameVariant(i.variant, variant)));
    this.cartItems.next(updated);
  }

  getItems() {
    return this.cartItems.getValue();
  }

  getTotal() {
    return this.cartItems.getValue()
      .reduce((sum, i) => sum + this.getItemPrice(i) * i.quantity, 0);
  }

  getItemPrice(item: CartItem) {
    if (item.gearData.name === 'TrailBeam Flashlight') {
      return item.variant?.size === 'Small' ? 19.99 : 24.99;
    }
    return item.gearData.price;
  }

  clearCart() {
    this.cartItems.next([]);
    return [];
  }

  private isSameVariant(a?: CartVariant, b?: CartVariant) {
    const aColor = a?.color || '';
    const bColor = b?.color || '';
    const aSize = a?.size || '';
    const bSize = b?.size || '';
    return aColor === bColor && aSize === bSize;
  }
}
