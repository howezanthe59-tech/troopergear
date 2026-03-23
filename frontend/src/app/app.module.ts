import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';

// Global Components (Essential for root layout)
import { NavbarComponent } from './component/navbar/navbar.component';
import { FooterComponent } from './component/footer/footer.component';
import { CartSidebarComponent } from './component/cart-sidebar/cart-sidebar.component';
import { LoginModalComponent } from './component/login-modal/login-modal.component';
import { AccessibilityWidgetComponent } from './component/accessibility-widget/accessibility-widget.component';
import { CookieConsentBannerComponent } from './component/cookie-consent-banner/cookie-consent-banner.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    CartSidebarComponent,
    LoginModalComponent,
    AccessibilityWidgetComponent,
    CookieConsentBannerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
