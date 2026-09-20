import { Injectable, signal } from '@angular/core';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  tone: string;
  mainImageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly items = signal<CartItem[]>([]);
  readonly cartItems = this.items.asReadonly();

  add(item: CartItem): void {
    this.items.update(items => {
      const existing = items.find(current => current.id === item.id);
      if (existing) {
        return items.map(current => current.id === item.id
          ? { ...current, quantity: current.quantity + item.quantity }
          : current);
      }
      return [...items, item];
    });
  }

  remove(itemId: string): void {
    this.items.update(items => items.filter(item => item.id !== itemId));
  }
}
