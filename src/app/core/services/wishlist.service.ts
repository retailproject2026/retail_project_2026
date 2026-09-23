import { Injectable, signal } from '@angular/core';
import { productIdentity } from './product-identity';

export interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  tone: string;
  mainImageUrl: string;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly items = signal<WishlistProduct[]>([]);
  readonly wishlistItems = this.items.asReadonly();

  isFavorite(productId: string, productName = ''): boolean {
    return this.items().some(item => item.id === productIdentity(productId, productName));
  }

  toggle(product: WishlistProduct): void {
    const normalizedProduct = { ...product, id: productIdentity(product.id, product.name) };
    if (this.isFavorite(normalizedProduct.id, normalizedProduct.name)) {
      this.remove(normalizedProduct.id);
      return;
    }

    this.items.update(items => [...items, normalizedProduct]);
  }

  remove(productId: string): void {
    this.items.update(items => items.filter(item => item.id !== productIdentity(productId, '')));
  }
}
