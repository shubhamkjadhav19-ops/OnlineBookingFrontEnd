export type Role = 'CUSTOMER' | 'SUPPLIER';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface Account {
  id: number;
  name: string;
  email: string;
  role: Role;
  latitude: number | null;
  longitude: number | null;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  inventory: number;
  supplierId: number;
  supplierName: string;
  supplierLatitude: number | null;
  supplierLongitude: number | null;
  distanceKm: number | null;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface OrderLine {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customerId: number;
  customerName: string;
  supplierId: number;
  supplierName: string;
  items: OrderLine[];
  total: number;
}

export interface ProductDraft {
  name: string;
  description: string;
  category: string;
  price: number;
  inventory: number;
}