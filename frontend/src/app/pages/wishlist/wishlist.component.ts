import { Component, OnInit } from '@angular/core';
import { WishlistService, IWishlistItem } from '../../services/wishlist.service';
import { MediaService } from '../../services/media.service';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  items: IWishlistItem[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private wishlistService: WishlistService, public media: MediaService) {}

  ngOnInit() {
    this.loadWishlist();
  }

  loadWishlist() {
    this.isLoading = true;
    this.errorMessage = '';
    this.wishlistService.getWishlist().subscribe({
      next: items => {
        this.items = items || [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load wishlist. Please log in and try again.';
        this.isLoading = false;
      }
    });
  }

  removeItem(itemId: number) {
    this.wishlistService.removeItem(itemId).subscribe({
      next: () => {
        this.items = this.items.filter(item => item.id !== itemId);
      },
      error: () => {
        this.errorMessage = 'Unable to remove item. Please try again.';
      }
    });
  }

  clearAll() {
    this.wishlistService.clearWishlist().subscribe({
      next: () => {
        this.items = [];
      },
      error: () => {
        this.errorMessage = 'Unable to clear wishlist. Please try again.';
      }
    });
  }
}
