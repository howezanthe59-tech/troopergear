import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { UIStateService } from '../../services/uistate.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  cartCount: number = 0;
  isMenuOpen: boolean = false;
  isLoggedIn = false;
  userRole: string | null = null;
  userName: string | null = null;
  isUserMenuOpen = false;
  isScrolled = false;

  constructor(
    private uiService: UIStateService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private el: ElementRef<HTMLElement>
  ) {}

  ngOnInit() {
    this.updateScrolledState();
    this.cartService.cartItems$.subscribe(items => {
      this.cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
    });
    this.authService.isLoggedIn$.subscribe(state => {
      this.isLoggedIn = state;
      this.userRole = this.authService.getUserRole();
      this.userName = this.authService.getUserName();
      if (!this.isLoggedIn) this.isUserMenuOpen = false;
    });
  }

  get displayName() {
    if (!this.isLoggedIn) return '';
    if (this.userRole === 'admin') return 'Admin';
    const raw = String(this.userName || '').trim();
    if (!raw) return 'Member';
    return raw.split(/\s+/)[0];
  }

  openLogin() {
    this.uiService.toggleLoginModal(true);
    this.isMenuOpen = false;
    this.isUserMenuOpen = false;
  }

  openCart() {
    this.uiService.toggleCartSidebar(true);
    this.isMenuOpen = false;
    this.isUserMenuOpen = false;
  }

  toggleMobileMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) this.isUserMenuOpen = false;
  }

  toggleUserMenu() {
    if (!this.isLoggedIn) {
      this.openLogin();
      return;
    }
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.isUserMenuOpen = false;
    this.isMenuOpen = false;
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isUserMenuOpen) return;
    const target = event.target as Node | null;
    if (!target) return;
    if (this.el.nativeElement.contains(target)) return;
    this.isUserMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.isUserMenuOpen = false;
    this.isMenuOpen = false;
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.updateScrolledState();
  }

  private updateScrolledState() {
    this.isScrolled = (typeof window !== 'undefined' && window.scrollY > 6);
  }
}
