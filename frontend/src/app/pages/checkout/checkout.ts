import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/gear-item.model';

declare var paypal: any;

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  orderAmount = '0.00';
  paymentSuccess = false;
  paymentError = '';
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    console.log('Checkout component loaded');

    this.cartService.loadCart().subscribe({
      next: () => {
        this.cartItems = this.cartService.getItems();
        this.updateOrderAmount();
        setTimeout(() => this.renderPaypalButtons(), 0);
      },
      error: (err) => {
        console.error('Failed to load cart', err);
        this.paymentError = 'Could not load your cart.';
      }
    });
  }

  updateOrderAmount(): void {
    this.orderAmount = this.cartService.getTotal().toFixed(2);
  }

  getItemPrice(item: CartItem): number {
    return this.cartService.getItemPrice(item);
  }

  getVariantLabel(item: CartItem): string {
    const parts: string[] = [];
    if (item.variant?.color) parts.push(`Color: ${item.variant.color}`);
    if (item.variant?.size) parts.push(`Size: ${item.variant.size}`);
    return parts.join(' | ');
  }

 renderPaypalButtons(): void {
  const paypalContainer = document.getElementById('paypal-button-container');
  if (!paypalContainer) return;

  if (typeof paypal === 'undefined' || !paypal?.Buttons) {
    console.warn('PayPal SDK not ready yet, retrying...');
    setTimeout(() => this.renderPaypalButtons(), 500);
    return;
  }

  paypalContainer.innerHTML = '';

  paypal.Buttons({
    createOrder: async () => {
      const data = await this.http.post<{ id: string }>(
        `${this.apiUrl}/paypal/create-order`,
        { amount: this.orderAmount }
      ).toPromise();

      return data!.id;
    },

    onApprove: async (data: any) => {
      try {
        const result = await this.http.post<{ status: string }>(
          `${this.apiUrl}/paypal/capture-order`,
          { orderID: data.orderID }
        ).toPromise();

        if (result?.status !== 'COMPLETED') {
          this.paymentError = 'Payment was not completed.';
          return;
        }

        await this.http.post(
          `${this.apiUrl}/orders`,
          {}
        ).toPromise();

        this.paymentSuccess = true;
        this.paymentError = '';
        this.cartItems = [];
        this.orderAmount = '0.00';
      } catch (err) {
        console.error(err);
        this.paymentError = 'Payment succeeded, but the order could not be saved.';
      }
    },

    onError: (err: any) => {
      this.paymentError = 'Payment failed. Please try again.';
      console.error(err);
    }
  }).render('#paypal-button-container');
}
}
