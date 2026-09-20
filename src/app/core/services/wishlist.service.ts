import { Injectable, signal } from '@angular/core';

export interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  tone: string;
  mainImageUrl: string;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly items = signal<WishlistProduct[]>([]);
  readonly wishlistItems = this.items.asReadonly();

  isFavorite(productId: string): boolean {
    return this.items().some(item => item.id === productId);
  }

  toggle(product: WishlistProduct): void {
    if (this.isFavorite(product.id)) {
      this.remove(product.id);
      return;
    }

    this.items.update(items => [...items, product]);
  }

  remove(productId: string): void {
    this.items.update(items => items.filter(item => item.id !== productId));
  }
}
