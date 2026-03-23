import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, distinctUntilChanged, map, of, take, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export type AccessibilityPreferencesVersion = 1;

export interface AccessibilityPreferences {
  fontScale: number;
  dyslexiaFont: boolean;
  letterSpacing: number; // em
  lineHeight: number;

  darkMode: boolean;
  highContrast: boolean;
  invertColors: boolean;

  highlightLinks: boolean;
  focusOutline: boolean;

  reduceMotion: boolean;
}

export interface AccessibilityRecord {
  version: AccessibilityPreferencesVersion;
  preferences: AccessibilityPreferences;
  updatedAt: string; // ISO timestamp
}

interface AccessibilityApiResponse {
  accessibility: AccessibilityRecord | null;
}

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private readonly storageKey = 'tg_accessibility_v1';
  private readonly apiUrl = environment.apiUrl;

  private readonly recordSubject = new BehaviorSubject<AccessibilityRecord | null>(this.readFromStorage());
  readonly record$ = this.recordSubject.asObservable();

  private syncing = false;

  constructor(
    private auth: AuthService,
    private http: HttpClient
  ) {
    const initial = this.recordSubject.value ?? this.readLegacySettings();
    if (initial) {
      this.writeToStorage(initial);
      this.recordSubject.next(initial);
      this.applyPreferences(initial.preferences);
    } else {
      // Ensure defaults are applied via CSS variables/classes; nothing to do here.
    }

    this.auth.isLoggedIn$
      .pipe(distinctUntilChanged())
      .subscribe((isLoggedIn) => {
        if (isLoggedIn) this.syncWithServer();
      });
  }

  getPreferences(): AccessibilityPreferences {
    return this.recordSubject.value?.preferences ?? this.defaultPreferences();
  }

  updatePreferences(next: Partial<AccessibilityPreferences>): void {
    const current = this.getPreferences();
    const merged: AccessibilityPreferences = this.clampPreferences({ ...current, ...next });
    const record: AccessibilityRecord = {
      version: 1,
      preferences: merged,
      updatedAt: new Date().toISOString()
    };

    this.writeToStorage(record);
    this.recordSubject.next(record);
    this.applyPreferences(record.preferences);

    if (this.auth.isLoggedIn()) {
      this.upsertServerRecord(record).pipe(take(1)).subscribe();
    }
  }

  reset(): void {
    const record: AccessibilityRecord = {
      version: 1,
      preferences: this.defaultPreferences(),
      updatedAt: new Date().toISOString()
    };
    this.writeToStorage(record);
    this.recordSubject.next(record);
    this.applyPreferences(record.preferences);

    if (this.auth.isLoggedIn()) {
      this.upsertServerRecord(record).pipe(take(1)).subscribe();
    }
  }

  private defaultPreferences(): AccessibilityPreferences {
    return {
      fontScale: 1.05,
      dyslexiaFont: false,
      letterSpacing: 0,
      lineHeight: 1.6,
      darkMode: false,
      highContrast: false,
      invertColors: false,
      highlightLinks: false,
      focusOutline: false,
      reduceMotion: false
    };
  }

  private clampPreferences(prefs: AccessibilityPreferences): AccessibilityPreferences {
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    return {
      ...prefs,
      fontScale: Math.round(clamp(Number(prefs.fontScale) || 1.05, 0.85, 1.4) * 100) / 100,
      letterSpacing: Math.round(clamp(Number(prefs.letterSpacing) || 0, 0, 0.12) * 100) / 100,
      lineHeight: Math.round(clamp(Number(prefs.lineHeight) || 1.6, 1.2, 2.2) * 100) / 100,
      dyslexiaFont: Boolean(prefs.dyslexiaFont),
      darkMode: Boolean(prefs.darkMode),
      highContrast: Boolean(prefs.highContrast),
      invertColors: Boolean(prefs.invertColors),
      highlightLinks: Boolean(prefs.highlightLinks),
      focusOutline: Boolean(prefs.focusOutline),
      reduceMotion: Boolean(prefs.reduceMotion)
    };
  }

  private applyPreferences(prefs: AccessibilityPreferences): void {
    const root = document.documentElement;

    root.style.setProperty('--a11y-font-scale', String(prefs.fontScale));
    root.style.setProperty('--a11y-letter-spacing', `${prefs.letterSpacing}em`);
    root.style.setProperty('--a11y-line-height', String(prefs.lineHeight));

    root.classList.toggle('tg-a11y-dyslexia', prefs.dyslexiaFont);
    root.classList.toggle('tg-a11y-dark-mode', prefs.darkMode);
    root.classList.toggle('tg-a11y-high-contrast', prefs.highContrast);
    root.classList.toggle('tg-a11y-invert', prefs.invertColors);
    root.classList.toggle('tg-a11y-highlight-links', prefs.highlightLinks);
    root.classList.toggle('tg-a11y-focus-outline', prefs.focusOutline);
    root.classList.toggle('tg-a11y-reduce-motion', prefs.reduceMotion);
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
      .get<AccessibilityApiResponse>(`${this.apiUrl}/profile/accessibility-preferences`, { headers: this.authHeaders() })
      .pipe(
        take(1),
        catchError(() => of({ accessibility: null } as AccessibilityApiResponse)),
        tap(() => {
          this.syncing = false;
        })
      )
      .subscribe((res) => {
        const serverRecord = res?.accessibility ?? null;
        const localRecord = this.recordSubject.value;

        if (!serverRecord && localRecord) {
          this.upsertServerRecord(localRecord).pipe(take(1)).subscribe();
          return;
        }

        if (serverRecord && !localRecord) {
          this.writeToStorage(serverRecord);
          this.recordSubject.next(serverRecord);
          this.applyPreferences(serverRecord.preferences);
          return;
        }

        if (!serverRecord || !localRecord) return;

        const localTime = Date.parse(localRecord.updatedAt || '') || 0;
        const serverTime = Date.parse(serverRecord.updatedAt || '') || 0;

        if (localTime > serverTime) {
          this.upsertServerRecord(localRecord).pipe(take(1)).subscribe();
          return;
        }

        if (serverTime > localTime) {
          this.writeToStorage(serverRecord);
          this.recordSubject.next(serverRecord);
          this.applyPreferences(serverRecord.preferences);
        }
      });
  }

  private upsertServerRecord(record: AccessibilityRecord): Observable<AccessibilityRecord | null> {
    return this.http
      .put<AccessibilityApiResponse>(`${this.apiUrl}/profile/accessibility-preferences`, record, { headers: this.authHeaders() })
      .pipe(
        map((res) => res?.accessibility ?? null),
        catchError(() => of(null))
      );
  }

  private readFromStorage(): AccessibilityRecord | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AccessibilityRecord;
      if (!parsed || parsed.version !== 1) return null;
      if (!parsed.preferences || typeof parsed.updatedAt !== 'string') return null;
      return {
        version: 1,
        preferences: this.clampPreferences(parsed.preferences as AccessibilityPreferences),
        updatedAt: parsed.updatedAt
      };
    } catch {
      return null;
    }
  }

  private writeToStorage(record: AccessibilityRecord): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(record));
    } catch {
      // localStorage can be blocked; settings still apply for the current session.
    }
  }

  private readLegacySettings(): AccessibilityRecord | null {
    try {
      const scale = parseFloat(localStorage.getItem('a11y_font_scale') || '');
      const contrast = localStorage.getItem('a11y_contrast') === '1';
      const reduceMotion = localStorage.getItem('a11y_reduce_motion') === '1';
      const readable = localStorage.getItem('a11y_readable_font') === '1';
      const darkMode = localStorage.getItem('a11y_dark_mode') === '1';

      const hasAny =
        Number.isFinite(scale) ||
        contrast ||
        reduceMotion ||
        readable ||
        darkMode;

      if (!hasAny) return null;

      const defaults = this.defaultPreferences();
      const prefs: AccessibilityPreferences = {
        ...defaults,
        fontScale: Number.isFinite(scale) ? scale : defaults.fontScale,
        highContrast: contrast,
        reduceMotion,
        darkMode,
        ...(readable ? { lineHeight: 1.8, letterSpacing: 0.02 } : {})
      };

      return {
        version: 1,
        preferences: this.clampPreferences(prefs),
        updatedAt: new Date().toISOString()
      };
    } catch {
      return null;
    }
  }
}

