import { Component, OnInit } from '@angular/core';
import { AdminProductService, AdminProduct } from '../../services/admin-product.service';
import { AdminOrdersService, AdminOrder } from '../../services/admin-orders.service';
import { AdminCustomersService, AdminCustomer } from '../../services/admin-customers.service';
import { AuthService } from '../../services/auth.service';
import { MediaService } from '../../services/media.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  activeTab: 'overview' | 'products' | 'orders' | 'customers' = 'overview';

  products: AdminProduct[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  orders: AdminOrder[] = [];
  isOrdersLoading = false;
  ordersErrorMessage = '';

  customers: AdminCustomer[] = [];
  isCustomersLoading = false;
  customersErrorMessage = '';

  editingId: number | null = null;
  selectedImageFile: File | null = null;
  selectedImagePreviewUrl: string | null = null;
  searchTerm = '';
  private toastTimer: any = null;
  private readonly mountedAt = new Date();

  form: AdminProduct = {
    name: '',
    category: '',
    description: '',
    price: 0,
    stock: 0,
    badge: '',
    image: ''
  };

  constructor(
    private adminProductService: AdminProductService,
    private adminOrdersService: AdminOrdersService,
    private adminCustomersService: AdminCustomersService,
    public authService: AuthService,
    public media: MediaService
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  get greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  get todayLabel() {
    return this.mountedAt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  get adminName() {
    return this.authService.getUserName() || 'Admin';
  }

  get headerTitle() {
    if (this.activeTab === 'orders') return 'Orders';
    if (this.activeTab === 'customers') return 'Customers';
    if (this.activeTab === 'products') return 'Products';
    return `Welcome back, ${this.adminName}`;
  }

  get headerSubtitle() {
    if (this.activeTab === 'orders') return 'Review recent order activity across all customers.';
    if (this.activeTab === 'customers') return 'Browse your customer directory and contact details.';
    if (this.activeTab === 'products') return 'Manage your product catalog and images.';
    return `${this.greeting} • ${this.todayLabel} • Live snapshot of catalog health.`;
  }

  get totalProducts() {
    return this.products.length;
  }

  get lowStockCount() {
    return this.products.filter(p => Number(p?.stock || 0) <= 5).length;
  }

  get categoryCount() {
    const set = new Set(this.products.map(p => String(p?.category || '').trim()).filter(Boolean));
    return set.size;
  }

  get filteredProducts(): AdminProduct[] {
    const term = String(this.searchTerm || '').trim().toLowerCase();
    if (!term) return this.products;
    return this.products.filter(p => {
      return (
        String(p?.name || '').toLowerCase().includes(term) ||
        String(p?.category || '').toLowerCase().includes(term) ||
        String(p?.badge || '').toLowerCase().includes(term)
      );
    });
  }

  startCreate() {
    this.cancelEdit();
    this.clearMessages();
    if (this.activeTab !== 'products') this.setTab('products');
  }

  setTab(tab: 'overview' | 'products' | 'orders' | 'customers') {
    this.activeTab = tab;
    this.clearSectionErrors();
    if (tab === 'products') {
      if (!this.products.length) this.loadProducts();
      return;
    }
    if (tab === 'orders') {
      this.loadOrders();
      return;
    }
    if (tab === 'customers') {
      this.loadCustomers();
      return;
    }
  }

  loadProducts() {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminProductService.list().subscribe({
      next: data => {
        this.products = (data || []).slice();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load products.';
        this.isLoading = false;
        this.scheduleToastClear();
      }
    });
  }

  loadOrders() {
    this.isOrdersLoading = true;
    this.ordersErrorMessage = '';
    this.adminOrdersService.listAll().subscribe({
      next: data => {
        this.orders = (data || []).slice();
        this.isOrdersLoading = false;
      },
      error: () => {
        this.ordersErrorMessage = 'Unable to load orders.';
        this.isOrdersLoading = false;
      }
    });
  }

  loadCustomers() {
    this.isCustomersLoading = true;
    this.customersErrorMessage = '';
    this.adminCustomersService.listCustomers().subscribe({
      next: data => {
        this.customers = (data || []).slice();
        this.isCustomersLoading = false;
      },
      error: () => {
        this.customersErrorMessage = 'Unable to load customers.';
        this.isCustomersLoading = false;
      }
    });
  }

  submit() {
    this.clearMessages();
    if (!this.form.name || !this.form.category) {
      this.errorMessage = 'Name and category are required.';
      this.scheduleToastClear();
      return;
    }
    if (this.form.price <= 0) {
      this.errorMessage = 'Price must be greater than 0.';
      this.scheduleToastClear();
      return;
    }
    if (!Number.isInteger(Number(this.form.stock)) || this.form.stock < 0) {
      this.errorMessage = 'Stock must be a non-negative integer.';
      this.scheduleToastClear();
      return;
    }
    const payload: AdminProduct = {
      ...this.form,
      badge: this.form.badge || null,
      description: this.form.description || null,
      image: this.form.image || null
    };

    const request$ = this.editingId
      ? this.adminProductService.update(this.editingId, payload, this.selectedImageFile)
      : this.adminProductService.create(payload, this.selectedImageFile);

    request$.subscribe({
      next: () => {
        this.successMessage = this.editingId ? 'Product updated successfully.' : 'Product created successfully.';
        this.scheduleToastClear();
        this.resetForm();
        this.loadProducts();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || (this.editingId ? 'Unable to update product.' : 'Unable to create product.');
        this.scheduleToastClear();
      }
    });
  }

  startEdit(product: AdminProduct) {
    this.clearMessages();
    this.editingId = product.id || null;
    this.form = {
      id: product.id,
      name: product.name || '',
      category: product.category || '',
      description: product.description || '',
      price: Number(product.price || 0),
      stock: Number(product.stock || 0),
      badge: product.badge || '',
      image: product.image || ''
    };
    this.clearSelectedImage();
  }

  cancelEdit() {
    this.resetForm();
  }

  deleteProduct(product: AdminProduct) {
    const id = Number(product?.id);
    if (!id) return;
    const ok = confirm(`Delete "${product.name}"? This cannot be undone.`);
    if (!ok) return;
    this.clearMessages();
    this.adminProductService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Product deleted.';
        this.scheduleToastClear();
        if (this.editingId === id) this.resetForm();
        this.loadProducts();
      },
      error: () => {
        this.errorMessage = 'Unable to delete product.';
        this.scheduleToastClear();
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] || null;
    this.clearSelectedImage();
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select an image file.';
      this.scheduleToastClear();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image must be 5MB or smaller.';
      this.scheduleToastClear();
      return;
    }
    this.selectedImageFile = file;
    this.selectedImagePreviewUrl = URL.createObjectURL(file);
  }

  getImagePreviewUrl(): string {
    if (this.selectedImagePreviewUrl) return this.selectedImagePreviewUrl;
    return this.media.productImageUrl(this.form.image);
  }

  private clearSelectedImage() {
    this.selectedImageFile = null;
    if (this.selectedImagePreviewUrl) {
      URL.revokeObjectURL(this.selectedImagePreviewUrl);
    }
    this.selectedImagePreviewUrl = null;
  }

  private resetForm() {
    this.editingId = null;
    this.form = { name: '', category: '', description: '', price: 0, stock: 0, badge: '', image: '' };
    this.clearSelectedImage();
  }

  dismissToast() {
    this.clearMessages();
  }

  trackByProductId(index: number, item: AdminProduct) {
    return item?.id ?? index;
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  private clearSectionErrors() {
    this.ordersErrorMessage = '';
    this.customersErrorMessage = '';
  }

  private scheduleToastClear() {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (!this.errorMessage && !this.successMessage) return;
    this.toastTimer = setTimeout(() => {
      this.errorMessage = '';
      this.successMessage = '';
      this.toastTimer = null;
    }, 4200);
  }
}
