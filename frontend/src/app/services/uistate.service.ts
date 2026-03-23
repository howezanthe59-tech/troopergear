import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UIStateService {
  private loginModalOpen = new BehaviorSubject<boolean>(false);
  loginModalOpen$ = this.loginModalOpen.asObservable();
  private loginModalTab = new BehaviorSubject<'login' | 'register'>('login');
  loginModalTab$ = this.loginModalTab.asObservable();

  private cartSidebarOpen = new BehaviorSubject<boolean>(false);
  cartSidebarOpen$ = this.cartSidebarOpen.asObservable();

  constructor() { }

  toggleLoginModal(open?: boolean) {
    if (open !== undefined) {
      this.loginModalOpen.next(open);
    } else {
      this.loginModalOpen.next(!this.loginModalOpen.getValue());
    }
  }

  openLoginModal(tab: 'login' | 'register' = 'login') {
    this.loginModalTab.next(tab);
    this.loginModalOpen.next(true);
  }

  toggleCartSidebar(open?: boolean) {
    if (open !== undefined) {
      this.cartSidebarOpen.next(open);
    } else {
      this.cartSidebarOpen.next(!this.cartSidebarOpen.getValue());
    }
  }
}
