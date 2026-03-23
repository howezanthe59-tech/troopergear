import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CookieConsentService, CookiePreferences } from '../../services/cookie-consent.service';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.css']
})
export class PrivacyComponent implements OnInit, OnDestroy {
  draft: CookiePreferences = this.cookieConsent.getPreferences();
  consentUpdatedAt: string | null = this.cookieConsent.getCurrentConsent()?.updatedAt ?? null;
  savedMessage = '';

  private sub?: Subscription;
  private savedTimer?: number;

  constructor(private cookieConsent: CookieConsentService) {}

  ngOnInit(): void {
    this.cookieConsent.dismissBannerForSession();

    this.sub = this.cookieConsent.consent$.subscribe((record) => {
      if (record) {
        this.draft = { ...record.preferences };
        this.consentUpdatedAt = record.updatedAt;
        return;
      }
      this.draft = this.cookieConsent.getPreferences();
      this.consentUpdatedAt = null;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.savedTimer) window.clearTimeout(this.savedTimer);
  }

  acceptAll(): void {
    this.cookieConsent.acceptAll('privacy');
    this.flashSaved('Preferences saved: accepted all cookies.');
  }

  rejectNonEssential(): void {
    this.cookieConsent.rejectNonEssential('privacy');
    this.flashSaved('Preferences saved: rejected non-essential cookies.');
  }

  savePreferences(): void {
    this.cookieConsent.savePreferences(
      {
        analytics: this.draft.analytics,
        marketing: this.draft.marketing,
        functional: this.draft.functional
      },
      'privacy'
    );
    this.flashSaved('Preferences saved.');
  }

  private flashSaved(message: string): void {
    this.savedMessage = message;
    if (this.savedTimer) window.clearTimeout(this.savedTimer);
    this.savedTimer = window.setTimeout(() => {
      this.savedMessage = '';
    }, 4000);
  }
}
