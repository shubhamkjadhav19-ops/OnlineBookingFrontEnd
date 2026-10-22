import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account, Cart, Order, Product, ProductDraft } from './api.models';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class MarketplaceApiService {
  private readonly apiUrl = `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  register(input: { name: string; email: string; password: string; role: string; latitude?: number; longitude?: number }): Observable<Account> {
    alert('Registering user with input: ' + JSON.stringify(input)); // Debugging line
    return this.http.post<Account>(`${this.apiUrl}/auth/register`, input);
  }

  login(email: string, password: string): Observable<Account> {
    return this.http.post<Account>(`${this.apiUrl}/auth/login`, { email, password });
  }

  updateLocation(latitude: number, longitude: number): Observable<Account> {
    return this.http.put<Account>(`${this.apiUrl}/account/location`, { latitude, longitude });
  }

  search(query: string, radiusKm: number): Observable<Product[]> {
    const params = new HttpParams().set('query', query).set('radiusKm', radiusKm);
    return this.http.get<Product[]>(`${this.apiUrl}/products/search`, { params });
  }

  supplierProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/supplier/products`);
  }

  saveProduct(draft: ProductDraft, id?: number): Observable<Product> {
    return id
      ? this.http.put<Product>(`${this.apiUrl}/supplier/products/${id}`, draft)
      : this.http.post<Product>(`${this.apiUrl}/supplier/products`, draft);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/supplier/products/${id}`);
  }

  cart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/customer/cart`);
  }

  addToCart(productId: number, quantity: number): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/customer/cart/items`, { productId, quantity });
  }

  setCartQuantity(itemId: number, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.apiUrl}/customer/cart/items/${itemId}`, { quantity });
  }

  removeCartItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/customer/cart/items/${itemId}`);
  }

  placeOrders(): Observable<Order[]> {
    return this.http.post<Order[]>(`${this.apiUrl}/customer/orders`, {});
  }

  customerOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/customer/orders`);
  }

  customerOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/customer/orders/${id}`);
  }

  supplierOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/supplier/orders`);
  }

  decideOrder(id: number, decision: 'ACCEPT' | 'REJECT'): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/supplier/orders/${id}/decision`, { decision });
  }
}