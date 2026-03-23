import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ProfileService, MeResponse, Address, AddressPayload } from '../../services/profile.service';
import { WishlistService } from '../../services/wishlist.service';
import { OrdersService, MyOrder } from '../../services/orders.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  activeTab: 'account' | 'address' = 'account';

  me: MeResponse | null = null;
  isLoading = true;
  isStatsLoading = true;
  toastType: 'success' | 'error' | '' = '';
  toastMessage = '';
  private toastTimer: any = null;

  orderCount = 0;
  wishlistCount = 0;
  addressCount = 0;
  lastOrder: MyOrder | null = null;

  accountForm = {
    name: '',
    email: '',
    phone_number: ''
  };

  passwordForm = {
    current: '',
    next: '',
    confirm: '',
    showCurrent: false,
    showNext: false,
    showConfirm: false
  };

  addresses: Address[] = [];
  isAddressesLoading = false;
  selectedAddressId: number | null = null;
  showAddressForm = false;
  editingAddressId: number | null = null;
  addressForm: AddressPayload = {
    street_address: '',
    city: '',
    parish_state: '',
    country: 'Jamaica',
    postal_code: '',
    is_default: false
  };

  constructor(
    public authService: AuthService,
    private profileService: ProfileService,
    private wishlistService: WishlistService,
    private ordersService: OrdersService
  ) {}

  ngOnInit() {
    this.loadMe();
    this.loadDashboardStats();
  }

  setTab(tab: 'account' | 'address') {
    this.activeTab = tab;
    if (tab === 'address') this.loadAddresses();
  }

  loadMe() {
    this.isLoading = true;
    this.profileService.me().subscribe({
      next: (me) => {
        this.me = me;
        this.accountForm = {
          name: me?.name || '',
          email: me?.email || '',
          phone_number: (me as any)?.phone_number || ''
        };
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('error', 'Unable to load profile.');
      }
    });
  }

  loadDashboardStats() {
    this.isStatsLoading = true;
    let done = 0;
    const finish = () => {
      done += 1;
      if (done >= 3) this.isStatsLoading = false;
    };

    this.ordersService.myOrders().subscribe({
      next: (orders) => {
        const list = (orders || []).slice();
        this.orderCount = list.length;
        this.lastOrder = list[0] || null;
        finish();
      },
      error: () => {
        this.orderCount = 0;
        this.lastOrder = null;
        finish();
      }
    });

    this.wishlistService.getWishlist().subscribe({
      next: (items) => {
        this.wishlistCount = (items || []).length;
        finish();
      },
      error: () => {
        this.wishlistCount = 0;
        finish();
      }
    });

    this.profileService.listAddresses().subscribe({
      next: (rows) => {
        this.addressCount = (rows || []).length;
        finish();
      },
      error: () => {
        this.addressCount = 0;
        finish();
      }
    });
  }

  saveAccount() {
    const name = String(this.accountForm.name || '').trim();
    const email = String(this.accountForm.email || '').trim().toLowerCase();
    const phone = String(this.accountForm.phone_number || '').trim();

    if (!name) return this.showToast('error', 'Full name is required.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.showToast('error', 'Enter a valid email.');
    if (phone && phone.length > 30) return this.showToast('error', 'Phone number is too long.');

    this.profileService.updateMe({ name, email, phone_number: phone || null }).subscribe({
      next: (res) => {
        const updated = res?.user;
        if (updated?.name) localStorage.setItem('user_name', updated.name);
        this.me = { ...(this.me as any), ...(updated as any) };
        this.showToast('success', 'Account updated.');
      },
      error: (err) => {
        this.showToast('error', err?.error?.error || 'Unable to update account.');
      }
    });
  }

  savePassword() {
    const current = String(this.passwordForm.current || '');
    const next = String(this.passwordForm.next || '');
    const confirm = String(this.passwordForm.confirm || '');
    if (!current || !next) return this.showToast('error', 'Enter current and new password.');
    if (next.length < 8) return this.showToast('error', 'New password must be at least 8 characters.');
    if (next !== confirm) return this.showToast('error', 'Password confirmation does not match.');

    this.profileService.updatePassword(current, next).subscribe({
      next: () => {
        this.passwordForm.current = '';
        this.passwordForm.next = '';
        this.passwordForm.confirm = '';
        this.showToast('success', 'Password updated.');
      },
      error: (err) => {
        this.showToast('error', err?.error?.error || 'Unable to update password.');
      }
    });
  }

  loadAddresses() {
    this.isAddressesLoading = true;
    this.profileService.listAddresses().subscribe({
      next: (rows) => {
        this.addresses = (rows || []).slice();
        const stillExists = this.selectedAddressId
          ? this.addresses.find(a => a.id === this.selectedAddressId)
          : null;
        this.selectedAddressId = stillExists?.id ?? (this.addresses[0]?.id ?? null);
        this.isAddressesLoading = false;
      },
      error: () => {
        this.isAddressesLoading = false;
        this.showToast('error', 'Unable to load addresses.');
      }
    });
  }

  startAddAddress() {
    this.showAddressForm = true;
    this.editingAddressId = null;
    this.addressForm = {
      street_address: '',
      city: '',
      parish_state: '',
      country: 'Jamaica',
      postal_code: '',
      is_default: false
    };
  }

  selectAddress(a: Address) {
    this.selectedAddressId = a?.id ?? null;
    this.showAddressForm = false;
    this.editingAddressId = null;
  }

  get selectedAddress(): Address | null {
    if (!this.selectedAddressId) return null;
    return this.addresses.find(a => a.id === this.selectedAddressId) || null;
  }

  startEditAddress(a: Address) {
    this.selectedAddressId = a.id;
    this.showAddressForm = true;
    this.editingAddressId = a.id;
    this.addressForm = {
      street_address: a.street_address || '',
      city: a.city || '',
      parish_state: a.parish_state || '',
      country: a.country || 'Jamaica',
      postal_code: a.postal_code || '',
      is_default: Boolean(a.is_default)
    };
  }

  cancelAddressForm() {
    this.showAddressForm = false;
    this.editingAddressId = null;
  }

  saveAddress() {
    const payload: AddressPayload = {
      street_address: String(this.addressForm.street_address || '').trim(),
      city: String(this.addressForm.city || '').trim(),
      parish_state: String(this.addressForm.parish_state || '').trim(),
      country: String(this.addressForm.country || '').trim(),
      postal_code: String(this.addressForm.postal_code || '').trim() || null,
      is_default: Boolean(this.addressForm.is_default)
    };

    if (!payload.street_address || !payload.city || !payload.parish_state || !payload.country) {
      return this.showToast('error', 'Street, city, parish/state, and country are required.');
    }

    const req$ = this.editingAddressId
      ? this.profileService.updateAddress(this.editingAddressId, payload)
      : this.profileService.createAddress(payload);

    req$.subscribe({
      next: (saved) => {
        const nextSelectedId = saved?.id ?? null;
        this.showToast('success', this.editingAddressId ? 'Address updated.' : 'Address added.');
        this.showAddressForm = false;
        this.editingAddressId = null;
        this.loadAddresses();
        this.loadDashboardStats();
        if (nextSelectedId) this.selectedAddressId = nextSelectedId;
      },
      error: (err) => {
        this.showToast('error', err?.error?.error || 'Unable to save address.');
      }
    });
  }

  deleteAddress(a: Address) {
    const ok = confirm('Delete this address?');
    if (!ok) return;
    this.profileService.deleteAddress(a.id).subscribe({
      next: () => {
        this.showToast('success', 'Address deleted.');
        if (this.selectedAddressId === a.id) this.selectedAddressId = null;
        if (this.editingAddressId === a.id) this.startAddAddress();
        this.loadAddresses();
        this.loadDashboardStats();
      },
      error: () => this.showToast('error', 'Unable to delete address.')
    });
  }

  dismissToast() {
    this.toastType = '';
    this.toastMessage = '';
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  private showToast(type: 'success' | 'error', message: string) {
    this.toastType = type;
    this.toastMessage = message;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.dismissToast(), 4200);
  }
}
