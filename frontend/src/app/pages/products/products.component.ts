import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { IGearItem } from '../../models/gear-item.model';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { UIStateService } from '../../services/uistate.service';
import { MediaService } from '../../services/media.service';
import { XmlProductFeedService } from '../../services/xml-product-feed.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  private readonly flashlightLargePrice = 24.99;
  private readonly flashlightSmallPrice = 19.99;
  products: IGearItem[] = [];
  filteredProducts: IGearItem[] = [];
  isLoading = true;
  selectedProduct: IGearItem | null = null;
  isDetailsOpen = false;
  selectedSize = '';
  selectedColor: '' | string = '';
  selectedBagColor: '' | 'Green' | 'Black' = '';
  
  // Filters
  searchTerm = '';
  selectedCategory = 'all';
  selectedActivity = 'all';
  minPrice = 0;
  maxPrice = 500;
  categories = ['Footwear', 'Camping Tent', 'Backpack', 'Equipments'];
  activityOptions = ['Hiking', 'Camping', 'Climbing'];
  resultsFound = 0;
  suggestions: IGearItem[] = [];
  showSuggestions = false;
  wishlistMessage = '';
  isLoggedIn = false;
  dataSource: 'api' | 'xml' = 'api';
  feedStatus = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private uiService: UIStateService,
    public media: MediaService,
    private xmlFeed: XmlProductFeedService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProductsFromApi();
    this.authService.isLoggedIn$.subscribe(state => {
      this.isLoggedIn = state;
    });
  }

  loadProductsFromApi() {
    this.isLoading = true;
    this.dataSource = 'api';
    this.feedStatus = '';
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  loadProductsFromXml() {
    this.isLoading = true;
    this.dataSource = 'xml';
    this.feedStatus = 'Loading XML feed...';
    this.xmlFeed.fetchProducts().subscribe({
      next: (items) => {
        this.products = items || [];
        this.applyFilters();
        this.isLoading = false;
        const count = this.products.length;
        this.feedStatus = `Loaded ${count} product${count === 1 ? '' : 's'} from XML feed (products.xml).`;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.feedStatus = 'Unable to load XML feed. Please try again.';
      }
    });
  }

  useLiveData() {
    if (this.dataSource === 'api') return;
    this.loadProductsFromApi();
  }

  useXmlFeed() {
    if (this.dataSource === 'xml') return;
    this.loadProductsFromXml();
  }

  refreshXmlFeed() {
    if (this.dataSource !== 'xml') return;
    this.loadProductsFromXml();
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  filterByActivity(activity: string) {
    this.selectedActivity = activity;
    this.applyFilters();
  }

  /**
   * Core search and filtering engine (Source of Search).
   * Filters the master products list based on search terms, category/activity selection, and price range.
   */
  applyFilters() {
    this.normalizePriceRange();
    this.filteredProducts = this.products.filter(p => {
      // 1. Multi-field search check
      const searchLower = this.searchTerm.toLowerCase();
      const activityLabel = this.getProductActivity(p).toLowerCase();
      const matchesSearch = 
        p.name.toLowerCase().includes(searchLower) || 
        p.description.toLowerCase().includes(searchLower) ||
        p.type.toLowerCase().includes(searchLower) ||
        activityLabel.includes(searchLower); // Include derived activity in search results

      // 2. Fragmented category/activity check
      const matchesCategory =
        this.selectedCategory === 'all' ||
        p.type === this.selectedCategory;

      const matchesActivity =
        this.selectedActivity === 'all' ||
        activityLabel === this.selectedActivity.toLowerCase();

      // 3. Range-based price check
      const matchesPrice = p.price >= this.minPrice && p.price <= this.maxPrice;
      
      return matchesSearch && matchesCategory && matchesActivity && matchesPrice;
    });
    
    // Update live results count for accessibility (ARIA live regions)
    this.resultsFound = this.filteredProducts.length;
  }

  onSearchInput() {
    this.applyFilters();
    this.updateSuggestions();
  }

  onSearchFocus() {
    this.updateSuggestions();
  }

  onSearchBlur() {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 150);
  }

  updateSuggestions() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }
    const matches = this.products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.type.toLowerCase().includes(term) ||
      this.getProductActivity(p).toLowerCase().includes(term)
    );
    this.suggestions = matches.slice(0, 5);
    this.showSuggestions = this.suggestions.length > 0;
  }

  private getProductActivity(product: IGearItem) {
    const direct = String(product?.activity || '').trim();
    if (direct) return direct;

    const type = String(product?.type || '').trim();
    if (type === 'Footwear') return 'Hiking';
    if (type === 'Camping Tent') return 'Camping';
    if (type === 'Equipments') return 'Camping';
    if (type === 'Backpack') {
      const byId: Record<number, string> = {
        2: 'Camping',
        4: 'Climbing',
        6: 'Hiking'
      };
      return byId[Number(product?.id)] || 'Hiking';
    }
    return 'Hiking';
  }

  private normalizePriceRange() {
    if (!Number.isFinite(this.minPrice)) this.minPrice = 0;
    if (!Number.isFinite(this.maxPrice)) this.maxPrice = 0;
    this.minPrice = Math.max(0, this.minPrice);
    this.maxPrice = Math.max(0, this.maxPrice);
    if (this.minPrice > this.maxPrice) {
      const tmp = this.minPrice;
      this.minPrice = this.maxPrice;
      this.maxPrice = tmp;
    }
  }

  selectSuggestion(item: IGearItem) {
    this.searchTerm = item.name;
    this.applyFilters();
    this.showSuggestions = false;
  }

  onSortChange(event: any) {
    const sortBy = event.target.value;
    switch (sortBy) {
      case 'price-low':
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name-az':
        this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-za':
        this.filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        this.applyFilters(); // Reset to original order (or implement featured logic)
        break;
    }
  }


  addToCart(product: IGearItem, variant?: { color?: string; size?: string }) {
    this.cartService.addItem(product, variant);
  }

  addToCartWithVariant(product: IGearItem) {
    let variant: { color?: string; size?: string } | undefined = undefined;
    if (this.isSelectedFootwear()) {
      if (!this.selectedSize) {
        return;
      }
      const colors = this.selectedProduct ? this.getFootwearColors(this.selectedProduct) : [];
      const requiresColor = colors.length > 1;
      const resolvedColor = requiresColor ? this.selectedColor : (colors[0] || this.selectedColor);
      if (requiresColor && !resolvedColor) {
        return;
      }
      variant = { size: this.selectedSize, ...(resolvedColor ? { color: resolvedColor } : {}) };
    } else if (this.isSelectedBackpack()) {
      if (this.hasSelectedBackpackOptions()) {
        if (!this.selectedBagColor) {
          return;
        }
        variant = { color: this.selectedBagColor };
      }
    } else if (this.isSelectedFlashlight()) {
      if (!this.selectedSize) {
        return;
      }
      variant = { size: this.selectedSize };
    }
    this.cartService.addItem(product, variant);
  }

  addToWishlist(product: IGearItem) {
    this.wishlistMessage = '';
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const productId = Number(product?.id);
    if (!productId) return;
    this.wishlistService.addItem(productId).subscribe({
      next: (res) => {
        this.wishlistMessage = res?.message || 'Added to wishlist.';
      },
      error: (err) => {
        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }
        this.wishlistMessage = 'Unable to add to wishlist. Please try again.';
      }
    });
  }

  openDetails(product: IGearItem) {
    this.selectedProduct = product;
    this.isDetailsOpen = true;
    this.selectedSize = '';
    this.selectedColor = '';
    this.selectedBagColor = '';

    if (product.type === 'Footwear') {
      const colors = this.getFootwearColors(product);
      if (colors.length === 1) {
        this.selectedColor = colors[0];
      }
    }
  }

  closeDetails() {
    this.isDetailsOpen = false;
  }

  isSelectedFootwear() {
    return this.selectedProduct?.type === 'Footwear';
  }

  isSelectedBackpack() {
    return this.selectedProduct?.type === 'Backpack';
  }

  hasSelectedBackpackOptions() {
    return this.isSelectedBackpack() && (this.selectedProduct?.id === 4 || this.selectedProduct?.id === 6);
  }
  
  isSelectedFlashlight() {
    return this.selectedProduct?.name === 'TrailBeam Flashlight';
  }

  getFlashlightPrice(size: string) {
    return size === 'Small' ? this.flashlightSmallPrice : this.flashlightLargePrice;
  }

  getDisplayedPrice(product: IGearItem) {
    if (product.name === 'TrailBeam Flashlight') {
      return this.getFlashlightPrice(this.selectedSize);
    }
    return product.price;
  }

  setSize(size: string) {
    this.selectedSize = size;
  }

  setColor(color: string) {
    this.selectedColor = color;
  }

  setBagColor(color: 'Green' | 'Black') {
    this.selectedBagColor = color;
  }

  isVariantComplete() {
    if (this.isSelectedFootwear()) {
      if (!this.selectedSize) return false;
      if (!this.hasSelectedFootwearOptions()) return true;
      return !!this.selectedColor;
    }
    if (this.isSelectedBackpack()) {
      if (!this.hasSelectedBackpackOptions()) return true;
      return !!this.selectedBagColor;
    }
    if (this.isSelectedFlashlight()) {
      return !!this.selectedSize;
    }
    return true;
  }

  getSelectedImage(product: IGearItem) {
    if (product.name === 'TrailBeam Flashlight') {
      if (this.selectedSize === 'Small') return '/uploads/products/flashlight2.png';
      return '/uploads/products/flashlight.png';
    }
    if (product.type !== 'Footwear') {
      if (product.type === 'Backpack') {
        const bagMap: Record<number, { c1: string; c2: string }> = {
          4: { c1: '/uploads/products/bag.png', c2: '/uploads/products/bagA.png' },
          6: { c1: '/uploads/products/bag1.png', c2: '/uploads/products/bag1a.png' }
        };
        const match = bagMap[product.id];
        if (match) {
          if (this.selectedBagColor === 'Green') return match.c1;
          if (this.selectedBagColor === 'Black') return match.c2;
        }
      }
      return product.image;
    }
    const footwearMap: Record<number, Record<string, string>> = {
      1: { Brown: '/uploads/products/shoe.png', Black: '/uploads/products/shoe3.png', Green: '/uploads/products/shoe2.png' },
      3: { Black: '/uploads/products/MALSHOE.png' },
      5: { Classic: '/uploads/products/femshoe1.png', Pink: '/uploads/products/femshoe1A.png' }
    };
    const mapForProduct = footwearMap[product.id] || {};
    if (!this.selectedColor) {
      return product.image;
    }
    return mapForProduct[this.selectedColor] || product.image;
  }

  getFootwearColors(product: IGearItem) {
    if (product.type !== 'Footwear') {
      return [];
    }
    if (product.id === 1) return ['Brown', 'Black', 'Green'];
    if (product.id === 3) return ['Black'];
    if (product.id === 5) return ['Classic', 'Pink'];
    return [];
  }

  hasSelectedFootwearOptions() {
    if (!this.selectedProduct || this.selectedProduct.type !== 'Footwear') {
      return false;
    }
    return this.getFootwearColors(this.selectedProduct).length > 1;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isDetailsOpen) {
      this.closeDetails();
    }
  }
}
