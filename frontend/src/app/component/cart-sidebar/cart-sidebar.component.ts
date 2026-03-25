import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { UIStateService } from '../../services/uistate.service';
import { MediaService } from '../../services/media.service';

@Component({
  selector: 'app-cart-sidebar',
  templateUrl: './cart-sidebar.component.html',
  styleUrls: ['./cart-sidebar.component.css']
})
export class CartSidebarComponent implements OnInit {
  isShowing = false;
  itemsInBag: any[] = [];
  bagTotal: number = 0;

  constructor(
    private cartService: CartService,
    private uiService: UIStateService,
    private media: MediaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.uiService.cartSidebarOpen$.subscribe(open => {
      this.isShowing = open;
    });

    this.cartService.cartItems$.subscribe(items => {
      this.itemsInBag = items;
      this.bagTotal = this.cartService.getTotal();
    });
  }

  getItemPrice(item: any) {
    return this.cartService.getItemPrice(item);
  }

  closeBag() {
    this.uiService.toggleCartSidebar(false);
  }

  addOne(item: any) {
    this.cartService.addItem(item.gearData, item.variant);
  }

  removeOne(item: any) {
    this.cartService.decrementItem(item.gearData.id, item.variant);
  }

  deleteItem(item: any) {
    this.cartService.removeItem(item.id!).subscribe({
  next: () => {},
  error: err => console.error('Remove item failed', err)
});
  }

  getImgPath(item: any) {
    if (item?.gearData?.type === 'Footwear' && item?.variant?.color) {
      const footwearMap: Record<number, Record<string, string>> = {
        1: { Brown: '/uploads/products/shoe.png', Black: '/uploads/products/shoe3.png', Green: '/uploads/products/shoe2.png' },
        3: { Black: '/uploads/products/MALSHOE.png' },
        5: { Classic: '/uploads/products/femshoe1.png', Pink: '/uploads/products/femshoe1A.png' }
      };
      const mapForProduct = footwearMap[item.gearData.id] || {};
      const image = mapForProduct[item.variant.color] || item.gearData.image;
      return this.media.productImageUrl(image);
    }
    if (item?.gearData?.type === 'Backpack' && item?.variant?.color) {
      const bagMap: Record<string, string> = {
        Green: item.gearData.id === 4 ? '/uploads/products/bag.png' : '/uploads/products/bag1.png',
        Black: item.gearData.id === 4 ? '/uploads/products/bagA.png' : '/uploads/products/bag1a.png'
      };
      const image = bagMap[item.variant.color] || item.gearData.image;
      return this.media.productImageUrl(image);
    }
    return this.media.productImageUrl(item.gearData.image);
  }

  formatMoney(amount: number) {
    return amount.toFixed(2);
  }

  checkout() {
    this.closeBag();
    this.router.navigate(['/checkout']);
  }
}
