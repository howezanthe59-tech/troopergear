import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CookieConsentService } from '../../services/cookie-consent.service';

@Component({
  selector: 'app-cookie-consent-banner',
  templateUrl: './cookie-consent-banner.component.html',
  styleUrls: ['./cookie-consent-banner.component.css']
})
export class CookieConsentBannerComponent {
  readonly visible$ = this.cookieConsent.bannerVisible$;

  constructor(
    private cookieConsent: CookieConsentService,
    private router: Router
  ) {}

  acceptCookies(): void {
    this.cookieConsent.acceptAll('banner');
  }

  browseSettings(): void {
    this.cookieConsent.dismissBannerForSession();
    this.router.navigate(['/privacy'], { fragment: 'cookie-settings' });
  }
}

