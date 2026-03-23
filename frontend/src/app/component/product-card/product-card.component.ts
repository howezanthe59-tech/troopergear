import { Component, Input, Output, EventEmitter, HostBinding, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IGearItem } from '../../models/gear-item.model';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { UIStateService } from '../../services/uistate.service';
import { MediaService } from '../../services/media.service';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent implements OnInit, OnDestroy {
  @Input() data: any;
  @Input() minimal: boolean = false;
  @Input() popupMode: 'internal' | 'emit' = 'internal';
  @Output() addToCart = new EventEmitter<{ product: any; variant?: { color?: string } }>();
  @Output() viewMore = new EventEmitter<any>();

  showPopup = false;
  selectedColor: '' | string = '';
  selectedBagColor: '' | 'Green' | 'Black' = '';
  private colorCycleTimer: any = null;
  private colorCycleIndex = 0;
  @HostBinding('class.modal-open') get isModalOpen() { return this.showPopup; }

  onAddToCart() {
    if (this.isFootwear() && !this.selectedColor) {
      return;
    }
    if (this.isBackpack() && !this.selectedBagColor) {
      return;
    }
    let variant: { color?: string } | undefined = undefined;
    if (this.isFootwear()) {
      variant = { color: this.selectedColor };
    } else if (this.isBackpack()) {
      variant = { color: this.selectedBagColor };
    }
    this.addToCart.emit({ product: this.data, variant });
  }

  constructor(
    private router: Router,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private uiService: UIStateService,
    public media: MediaService
  ) {}

  ngOnInit() {
    this.startColorCycleIfNeeded();
  }

  ngOnDestroy() {
    if (this.colorCycleTimer) {
      clearInterval(this.colorCycleTimer);
      this.colorCycleTimer = null;
    }
  }

  onViewMore() {
    if (this.minimal) {
      this.router.navigate(['/products']);
      return;
    }
    if (this.popupMode === 'emit') {
      this.viewMore.emit(this.data);
      return;
    }
    this.togglePopup();
  }

  get isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  onAddToWishlist() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const productId = Number(this.data?.id);
    if (!productId) return;
    this.wishlistService.addItem(productId).subscribe({
      next: () => {},
      error: (err) => {
        if (err?.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  togglePopup() {
    console.log('Toggling popup for:', this.data?.name, 'New state:', !this.showPopup);
    this.showPopup = !this.showPopup;
  }

  getCardClasses() {
    return {
      'product-card': true,
      'modal-open': this.showPopup
    };
  }

  isFootwear() {
    return this.data?.type === 'Footwear';
  }

  isBackpack() {
    return this.data?.type === 'Backpack';
  }

  hasBackpackOptions() {
    return this.isBackpack() && (this.data?.id === 4 || this.data?.id === 6);
  }

  setColor(color: string) {
    this.selectedColor = color;
  }

  setBagColor(color: 'Green' | 'Black') {
    this.selectedBagColor = color;
  }


  getImageSrc() {
    if (!this.isFootwear()) {
      if (this.isBackpack()) {
        const bagMap: Record<number, { c1: string; c2: string }> = {
          4: { c1: '/uploads/products/bag.png', c2: '/uploads/products/bagA.png' },
          6: { c1: '/uploads/products/bag1.png', c2: '/uploads/products/bag1a.png' }
        };
        const match = bagMap[this.data?.id];
        if (match) {
          if (this.selectedBagColor === 'Green') return match.c1;
          if (this.selectedBagColor === 'Black') return match.c2;
        }
      }
      return this.data?.image || '';
    }
    const footwearMap: Record<number, Record<string, string>> = {
      1: { Brown: '/uploads/products/shoe.png', Black: '/uploads/products/shoe3.png', Green: '/uploads/products/shoe2.png' },
      3: { Black: '/uploads/products/MALSHOE.png' },
      5: { Classic: '/uploads/products/femshoe1.png', Pink: '/uploads/products/femshoe1A.png' }
    };
    const mapForProduct = footwearMap[this.data?.id] || {};
    return mapForProduct[this.selectedColor] || this.data?.image || '';
  }

  getFootwearColors() {
    if (!this.isFootwear()) {
      return [];
    }
    if (this.data?.id === 1) return ['Brown', 'Black', 'Green'];
    if (this.data?.id === 3) return ['Black'];
    if (this.data?.id === 5) return ['Classic', 'Pink'];
    return [];
  }

  hasFootwearOptions() {
    return this.getFootwearColors().length > 1;
  }

  private startColorCycleIfNeeded() {
    if (!this.minimal || !this.isFootwear()) return;
    const colors = this.getFootwearColors();
    if (colors.length <= 1) return;
    const list = colors;
    this.colorCycleIndex = 0;
    this.colorCycleTimer = setInterval(() => {
      this.selectedColor = list[this.colorCycleIndex % list.length];
      this.colorCycleIndex += 1;
    }, 3000);
  }
}
