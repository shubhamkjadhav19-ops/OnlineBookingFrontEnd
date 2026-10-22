import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Account, Cart, Order, Product } from '../api.models';
import { MarketplaceApiService } from '../marketplace-api.service';

type CustomerView = 'discover' | 'cart' | 'orders';

@Component({
  selector: 'nm-customer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-dashboard.component.html',
  encapsulation: ViewEncapsulation.None
})
export class CustomerDashboardComponent implements OnInit {
  @Input({ required: true }) account!: Account;

  customerView: CustomerView = 'discover';
  busy = false;
  error = '';
  notice = '';
  locationForm = { latitude: '', longitude: '' };
  searchForm = { query: '', radiusKm: 10 };
  products: Product[] = [];
  cart: Cart = { items: [], total: 0 };
  orders: Order[] = [];
  selectedOrder: Order | null = null;

  get hasSavedLocation(): boolean {
    return this.account.latitude !== null && this.account.longitude !== null;
  }

  constructor(private readonly api: MarketplaceApiService) {}

  ngOnInit(): void {
    this.locationForm.latitude = this.account.latitude?.toString() ?? '';
    this.locationForm.longitude = this.account.longitude?.toString() ?? '';
    this.searchProducts();
    this.loadCart();
  }

  saveLocation(): void {
    if (!this.locationForm.latitude || !this.locationForm.longitude) return;
    this.run(this.api.updateLocation(Number(this.locationForm.latitude), Number(this.locationForm.longitude)), account => {
      this.account = account;
      sessionStorage.setItem('near-market-account', JSON.stringify(account));
      this.notice = 'Location updated.';
      this.searchProducts();
    });
  }

  useCurrentLocation(): void {
    this.clearMessages();
    if (!navigator.geolocation) {
      this.error = 'Location access is not available in this browser.';
      return;
    }

    this.busy = true;
    navigator.geolocation.getCurrentPosition(
      position => {
        this.locationForm.latitude = position.coords.latitude.toFixed(6);
        this.locationForm.longitude = position.coords.longitude.toFixed(6);
        this.busy = false;
        this.saveLocation();
      },
      error => {
        this.error = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Allow access in your browser settings or enter coordinates manually.'
          : error.code === error.POSITION_UNAVAILABLE
            ? 'Your current location could not be determined. Please enter coordinates manually.'
            : 'Location lookup timed out. Please try again or enter coordinates manually.';
        this.busy = false;
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  searchProducts(): void {
    if (!this.hasSavedLocation) {
      this.products = [];
      this.clearMessages();
      return;
    }
    this.run(this.api.search(this.searchForm.query.trim(), Number(this.searchForm.radiusKm)), products => this.products = products);
  }

  addToCart(product: Product): void {
    this.run(this.api.addToCart(product.id, 1), cart => {
      this.cart = cart;
      this.notice = `${product.name} added to your basket.`;
    });
  }

  loadCart(): void { this.run(this.api.cart(), cart => this.cart = cart); }

  changeQuantity(itemId: number, quantity: number): void {
    if (quantity < 1) return;
    this.run(this.api.setCartQuantity(itemId, quantity), cart => this.cart = cart);
  }

  removeCartItem(itemId: number): void {
    this.run(this.api.removeCartItem(itemId), () => {
      this.cart.items = this.cart.items.filter(item => item.id !== itemId);
      this.cart.total = this.cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      this.notice = 'Item removed from your basket.';
    });
  }

  placeOrder(): void {
    this.run(this.api.placeOrders(), created => {
      this.cart = { items: [], total: 0 };
      this.customerView = 'orders';
      this.notice = created.length === 1 ? 'Order placed.' : `${created.length} supplier orders placed.`;
      this.loadOrders();
    });
  }

  loadOrders(): void { this.run(this.api.customerOrders(), orders => this.orders = orders); }

  trackOrder(order: Order): void { this.run(this.api.customerOrder(order.id), selected => this.selectedOrder = selected); }

  switchView(view: CustomerView): void {
    this.customerView = view;
    this.selectedOrder = null;
    if (view === 'discover') this.searchProducts();
    if (view === 'cart') this.loadCart();
    if (view === 'orders') this.loadOrders();
  }

  formatDistance(distance: number | null): string {
    return distance === null ? 'Distance unavailable' : `${distance.toFixed(1)} km away`;
  }

  clearMessages(): void { this.error = ''; this.notice = ''; }

  private run<T>(request: import('rxjs').Observable<T>, onSuccess: (value: T) => void): void {
    this.clearMessages();
    this.busy = true;
    request.subscribe({
      next: value => { onSuccess(value); this.busy = false; },
      error: error => this.fail(error)
    });
  }

  private fail(error: unknown): void {
    const response = error as HttpErrorResponse;
    const message = response.error?.message ?? response.error?.detail ?? response.error?.error;
    this.error = typeof message === 'string' ? message : response.status === 0
      ? 'Could not connect to the API. Check your connection and ensure the API allows requests from this site.'
      : `Request failed (${response.status}). Please check your details and try again.`;
    this.busy = false;
  }
}