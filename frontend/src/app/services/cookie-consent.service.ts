import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  take,
  tap
} from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export type CookieConsentVersion = 1;

export type CookieConsentSource = 'banner' | 'privacy';

export interface CookiePreferences {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export interface CookieConsentRecord {
  version: CookieConsentVersion;
  preferences: CookiePreferences;
  updatedAt: string; // ISO timestamp
}

interface CookieConsentApiResponse {
  consent: CookieConsentRecord | null;
}

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private readonly storageKey = 'tg_cookie_consent_v1';
  private readonly apiUrl = environment.apiUrl;

  private readonly consentSubject = new BehaviorSubject<CookieConsentRecord | null>(this.readFromStorage());
  readonly consent$ = this.consentSubject.asObservable();

  private readonly bannerDismissedSubject = new BehaviorSubject<boolean>(false);

  readonly bannerVisible$: Observable<boolean> = combineLatest([
    this.auth.isLoggedIn$,
    this.consent$,
    this.bannerDismissedSubject
  ]).pipe(
    map(([isLoggedIn, consent, dismissed]) => !dismissed && !isLoggedIn && !consent),
    distinctUntilChanged()
  );

  private syncing = false;
  private loadedCategories = new Set<'analytics' | 'marketing'>();

  constructor(
    private auth: AuthService,
    private http: HttpClient
  ) {
    const initial = this.consentSubject.value;
    if (initial) {
      this.applyConsent(initial.preferences);
    }

    this.auth.isLoggedIn$
      .pipe(distinctUntilChanged())
      .subscribe((isLoggedIn) => {
        if (isLoggedIn) this.syncWithServer();
      });
  }

  dismissBannerForSession(): void {
    this.bannerDismissedSubject.next(true);
  }

  getCurrentConsent(): CookieConsentRecord | null {
    return this.consentSubject.value;
  }

  getPreferences(): CookiePreferences {
    return this.consentSubject.value?.preferences ?? this.defaultPreferences();
  }

  isFunctionalAllowed(): boolean {
    return this.getPreferences().functional;
  }

  acceptAll(source: CookieConsentSource = 'privacy'): void {
    this.setConsent(
      {
        essential: true,
        analytics: true,
        marketing: true,
        functional: true
      },
      source
    );
  }

  rejectNonEssential(source: CookieConsentSource = 'privacy'): void {
    this.setConsent(
      {
        essential: true,
        analytics: false,
        marketing: false,
        functional: false
      },
      source
    );
  }

  savePreferences(preferences: Partial<Omit<CookiePreferences, 'essential'>> & { essential?: true }, source: CookieConsentSource = 'privacy'): void {
    const current = this.getPreferences();
    this.setConsent(
      {
        essential: true,
        analytics: Boolean(preferences.analytics ?? current.analytics),
        marketing: Boolean(preferences.marketing ?? current.marketing),
        functional: Boolean(preferences.functional ?? current.functional)
      },
      source
    );
  }

  /**
   * Analytics scripts must only run after the user has explicitly opted in.
   * Add your analytics bootstrap here (e.g., GA4, Plausible, etc.).
   */
  loadAnalytics(): void {
    if (this.loadedCategories.has('analytics')) return;

    // Example placeholder (no-op): inject a managed script tag only after consent.
    // Replace `src` with your analytics provider script URL when ready.
    // this.injectExternalScript('https://example.com/analytics.js', { 'data-tg-category': 'analytics' });

    this.loadedCategories.add('analytics');
  }

  /**
   * Marketing scripts must only run after the user has explicitly opted in.
   * Add your marketing pixels here (e.g., Meta Pixel, TikTok, etc.).
   */
  loadMarketing(): void {
    if (this.loadedCategories.has('marketing')) return;

    // Example placeholder (no-op): inject a managed script tag only after consent.
    // Replace `src` with your marketing provider script URL when ready.
    // this.injectExternalScript('https://example.com/marketing.js', { 'data-tg-category': 'marketing' });

    this.loadedCategories.add('marketing');
  }

  private unloadCategory(category: 'analytics' | 'marketing'): void {
    const selector = `script[data-tg-cookie-managed="true"][data-tg-category="${category}"]`;
    document.querySelectorAll(selector).forEach((el) => el.parentElement?.removeChild(el));
    this.loadedCategories.delete(category);
  }

  private applyConsent(preferences: CookiePreferences): void {
    if (preferences.analytics) this.loadAnalytics();
    else this.unloadCategory('analytics');

    if (preferences.marketing) this.loadMarketing();
    else this.unloadCategory('marketing');
  }

  private setConsent(preferences: CookiePreferences, source: CookieConsentSource): void {
    const record: CookieConsentRecord = {
      version: 1,
      preferences,
      updatedAt: new Date().toISOString()
    };

    this.writeToStorage(record);
    this.consentSubject.next(record);
    this.applyConsent(record.preferences);

    window.dispatchEvent(
      new CustomEvent('tg:cookie-consent-changed', {
        detail: { consent: record, source }
      })
    );

    if (this.auth.isLoggedIn()) {
      this.upsertServerConsent(record)
        .pipe(take(1))
        .subscribe({
          next: (serverRecord) => {
            if (!serverRecord) return;
            this.writeToStorage(serverRecord);
            this.consentSubject.next(serverRecord);
          },
          error: () => {
            // If the backend is offline, keep local preferences and retry next login.
          }
        });
    }
  }

  private defaultPreferences(): CookiePreferences {
    return {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    };
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  private syncWithServer(): void {
    if (this.syncing) return;
    this.syncing = true;

    this.http
      .get<CookieConsentApiResponse>(`${this.apiUrl}/profile/cookie-consent`, { headers: this.authHeaders() })
      .pipe(
        take(1),
        catchError(() => of({ consent: null } as CookieConsentApiResponse)),
        tap(() => {
          this.syncing = false;
        })
      )
      .subscribe((res) => {
        const serverConsent = res?.consent ?? null;
        const localConsent = this.consentSubject.value;

        if (!serverConsent && localConsent) {
          this.upsertServerConsent(localConsent).pipe(take(1)).subscribe();
          return;
        }

        if (serverConsent && !localConsent) {
          this.writeToStorage(serverConsent);
          this.consentSubject.next(serverConsent);
          this.applyConsent(serverConsent.preferences);
          return;
        }

        if (!serverConsent || !localConsent) return;

        const localTime = Date.parse(localConsent.updatedAt || '') || 0;
        const serverTime = Date.parse(serverConsent.updatedAt || '') || 0;

        if (localTime > serverTime) {
          this.upsertServerConsent(localConsent).pipe(take(1)).subscribe();
          return;
        }

        if (serverTime > localTime) {
          this.writeToStorage(serverConsent);
          this.consentSubject.next(serverConsent);
          this.applyConsent(serverConsent.preferences);
        }
      });
  }

  private upsertServerConsent(record: CookieConsentRecord): Observable<CookieConsentRecord | null> {
    return this.http
      .put<CookieConsentApiResponse>(`${this.apiUrl}/profile/cookie-consent`, record, { headers: this.authHeaders() })
      .pipe(
        map((res) => res?.consent ?? null),
        catchError(() => of(null))
      );
  }

  private readFromStorage(): CookieConsentRecord | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CookieConsentRecord;
      const prefs = parsed?.preferences;
      if (!parsed || parsed.version !== 1) return null;
      if (!prefs || prefs.essential !== true) return null;
      if (typeof prefs.analytics !== 'boolean') return null;
      if (typeof prefs.marketing !== 'boolean') return null;
      if (typeof prefs.functional !== 'boolean') return null;
      if (typeof parsed.updatedAt !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private writeToStorage(record: CookieConsentRecord): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(record));
    } catch {
      // localStorage can be blocked; consent will still apply for the current session.
    }
  }

  private injectExternalScript(src: string, attributes: Record<string, string>): void {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.setAttribute('data-tg-cookie-managed', 'true');
    Object.entries(attributes).forEach(([key, value]) => script.setAttribute(key, value));
    document.head.appendChild(script);
  }
}

