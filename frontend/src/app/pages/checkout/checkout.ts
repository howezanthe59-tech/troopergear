import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare var paypal: any; // tells TypeScript the global paypal SDK exists

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class CheckoutComponent implements OnInit {
  orderAmount = '49.99'; // replace with your dynamic cart total
  paymentSuccess = false;
  paymentError = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    paypal.Buttons({
      // Step 1: Create the order on your backend
      createOrder: () => {
        return this.http.post<{ id: string }>('/api/paypal/create-order', {
          amount: this.orderAmount
        }).toPromise().then(data => data!.id);
      },

      // Step 2: Capture after buyer approves
      onApprove: (data: any) => {
        return this.http.post<{ status: string }>('/api/paypal/capture-order', {
          orderID: data.orderID
        }).toPromise().then(result => {
          if (result?.status === 'COMPLETED') {
            this.paymentSuccess = true;
          }
        });
      },

      onError: (err: any) => {
        this.paymentError = 'Payment failed. Please try again.';
        console.error(err);
      }
    }).render('#paypal-button-container');
  }
}