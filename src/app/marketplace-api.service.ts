import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account, Cart, Order, Product, ProductDraft } from './api.models';

@Injectable({ providedIn: 'root' })
export class MarketplaceApiService {
  constructor(private readonly http: HttpClient) {}

  register(input: { name: string; email: string; password: string; role: string; latitude?: number; longitude?: number }): Observable<Account> {
    return this.http.post<Account>('/api/auth/register', input);
  }

  login(email: string, password: string): Observable<Account> {
    return this.http.post<Account>('/api/auth/login', { email, password });
  }

  updateLocation(latitude: number, longitude: number): Observable<Account> {
    return this.http.put<Account>('/api/account/location', { latitude, longitude });
  }

  search(query: string, radiusKm: number): Observable<Product[]> {
    const params = new HttpParams().set('query', query).set('radiusKm', radiusKm);
    return this.http.get<Product[]>('/api/products/search', { params });
  }

  supplierProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/supplier/products');
  }

  saveProduct(draft: ProductDraft, id?: number): Observable<Product> {
    return id
      ? this.http.put<Product>(`/api/supplier/products/${id}`, draft)
      : this.http.post<Product>('/api/supplier/products', draft);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`/api/supplier/products/${id}`);
  }

  cart(): Observable<Cart> {
    return this.http.get<Cart>('/api/customer/cart');
  }

  addToCart(productId: number, quantity: number): Observable<Cart> {
    return this.http.post<Cart>('/api/customer/cart/items', { productId, quantity });
  }

  setCartQuantity(itemId: number, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`/api/customer/cart/items/${itemId}`, { quantity });
  }

  removeCartItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`/api/customer/cart/items/${itemId}`);
  }

  placeOrders(): Observable<Order[]> {
    return this.http.post<Order[]>('/api/customer/orders', {});
  }

  customerOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/customer/orders');
  }

  customerOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`/api/customer/orders/${id}`);
  }

  supplierOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/supplier/orders');
  }

  decideOrder(id: number, decision: 'ACCEPT' | 'REJECT'): Observable<Order> {
    return this.http.patch<Order>(`/api/supplier/orders/${id}/decision`, { decision });
  }
}
