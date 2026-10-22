import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Account, Order, Product, ProductDraft } from '../api.models';
import { MarketplaceApiService } from '../marketplace-api.service';

type SupplierView = 'inventory' | 'orders';

@Component({
  selector: 'nm-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supplier-dashboard.component.html',
  encapsulation: ViewEncapsulation.None
})
export class SupplierDashboardComponent implements OnInit {
  @Input({ required: true }) account!: Account;

  supplierView: SupplierView = 'inventory';
  busy = false;
  error = '';
  notice = '';
  products: Product[] = [];
  orders: Order[] = [];
  productDraft: ProductDraft = this.emptyProduct();
  editingProductId: number | null = null;

  constructor(private readonly api: MarketplaceApiService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadOrders();
  }

  switchView(view: SupplierView): void {
    this.supplierView = view;
    if (view === 'inventory') this.loadProducts();
    else this.loadOrders();
  }

  editProduct(product: Product): void {
    this.editingProductId = product.id;
    this.productDraft = {
      name: product.name,
      description: product.description ?? '',
      category: product.category ?? '',
      price: product.price,
      inventory: product.inventory
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveProduct(): void {
    const wasEditing = this.editingProductId !== null;
    this.run(this.api.saveProduct(this.productDraft, this.editingProductId ?? undefined), () => {
      this.notice = wasEditing ? 'Product updated.' : 'Product added to your listings.';
      this.cancelProductEdit();
      this.loadProducts();
    });
  }

  deleteProduct(product: Product): void {
    if (!window.confirm(`Remove ${product.name} from your listings?`)) return;
    this.run(this.api.deleteProduct(product.id), () => {
      this.products = this.products.filter(item => item.id !== product.id);
      this.notice = `${product.name} removed.`;
    });
  }

  cancelProductEdit(): void {
    this.editingProductId = null;
    this.productDraft = this.emptyProduct();
  }

  decide(order: Order, decision: 'ACCEPT' | 'REJECT'): void {
    this.run(this.api.decideOrder(order.id, decision), updated => {
      this.orders = this.orders.map(item => item.id === updated.id ? updated : item);
      this.notice = `Order #${order.id} ${decision.toLowerCase()}ed.`;
    });
  }

  loadProducts(): void { this.run(this.api.supplierProducts(), products => this.products = products); }
  loadOrders(): void { this.run(this.api.supplierOrders(), orders => this.orders = orders); }
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

  private emptyProduct(): ProductDraft {
    return { name: '', description: '', category: '', price: 0.01, inventory: 0 };
  }
}