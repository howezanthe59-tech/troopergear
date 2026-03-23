import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AccessibilityPreferences, AccessibilityService } from '../../services/accessibility.service';

@Component({
  selector: 'app-accessibility-widget',
  templateUrl: './accessibility-widget.component.html',
  styleUrls: ['./accessibility-widget.component.css']
})
export class AccessibilityWidgetComponent implements OnInit, OnDestroy {
  isOpen = false;
  prefs: AccessibilityPreferences = this.a11y.getPreferences();

  private readonly destroy$ = new Subject<void>();
  private lastFocusedElement: HTMLElement | null = null;

  @ViewChild('openButton') openButtonRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('drawer') drawerRef?: ElementRef<HTMLElement>;

  constructor(private a11y: AccessibilityService) {}

  ngOnInit(): void {
    this.prefs = this.a11y.getPreferences();
    this.a11y.record$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.prefs = this.a11y.getPreferences();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  open(): void {
    if (this.isOpen) return;
    this.lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.isOpen = true;

    // Focus the drawer after it becomes visible.
    window.setTimeout(() => {
      const drawer = this.drawerRef?.nativeElement;
      if (!drawer) return;
      const first = this.getFocusableElements(drawer)[0];
      (first ?? drawer).focus();
    }, 0);
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    window.setTimeout(() => {
      (this.lastFocusedElement ?? this.openButtonRef?.nativeElement)?.focus?.();
    }, 0);
  }

  onDrawerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== 'Tab') return;
    const drawer = this.drawerRef?.nativeElement;
    if (!drawer) return;

    const focusables = this.getFocusableElements(drawer);
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    const isShift = event.shiftKey;

    if (!active) return;

    if (isShift && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!isShift && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  get fontPercent(): number {
    return Math.round((this.prefs.fontScale || 1) * 100);
  }

  get letterSpacingLabel(): string {
    const value = Math.round((this.prefs.letterSpacing || 0) * 100) / 100;
    return value === 0 ? 'Normal' : `${value}em`;
  }

  get lineHeightLabel(): string {
    return String(Math.round((this.prefs.lineHeight || 1.6) * 10) / 10);
  }

  increaseFont(): void {
    const next = Math.round(Math.min(1.4, (this.prefs.fontScale || 1.05) + 0.05) * 100) / 100;
    this.a11y.updatePreferences({ fontScale: next });
  }

  decreaseFont(): void {
    const next = Math.round(Math.max(0.85, (this.prefs.fontScale || 1.05) - 0.05) * 100) / 100;
    this.a11y.updatePreferences({ fontScale: next });
  }

  increaseLetterSpacing(): void {
    const next = Math.round(Math.min(0.12, (this.prefs.letterSpacing || 0) + 0.01) * 100) / 100;
    this.a11y.updatePreferences({ letterSpacing: next });
  }

  decreaseLetterSpacing(): void {
    const next = Math.round(Math.max(0, (this.prefs.letterSpacing || 0) - 0.01) * 100) / 100;
    this.a11y.updatePreferences({ letterSpacing: next });
  }

  increaseLineHeight(): void {
    const next = Math.round(Math.min(2.2, (this.prefs.lineHeight || 1.6) + 0.1) * 10) / 10;
    this.a11y.updatePreferences({ lineHeight: next });
  }

  decreaseLineHeight(): void {
    const next = Math.round(Math.max(1.2, (this.prefs.lineHeight || 1.6) - 0.1) * 10) / 10;
    this.a11y.updatePreferences({ lineHeight: next });
  }

  toggleBoolean(key: { [K in keyof AccessibilityPreferences]: AccessibilityPreferences[K] extends boolean ? K : never }[keyof AccessibilityPreferences]): void {
    const current = Boolean(this.prefs[key]);
    this.a11y.updatePreferences({ [key]: !current } as Partial<AccessibilityPreferences>);
  }

  reset(): void {
    this.a11y.reset();
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    return focusables.filter((el) => {
      const style = window.getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none';
    });
  }
}
