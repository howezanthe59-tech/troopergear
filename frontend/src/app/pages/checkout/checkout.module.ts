import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CheckoutRoutingModule } from './checkout-routing.module';
import { CheckoutComponent } from './checkout'; // ✅ add this

@NgModule({
  declarations: [CheckoutComponent], // ✅ add this
  imports: [
    CommonModule,
    HttpClientModule, // ✅ needed for HttpClient in the component
    CheckoutRoutingModule
  ]
})
export class CheckoutModule { }