import { Injectable, signal } from '@angular/core';
import { productIdentity } from './product-identity';

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
  private readonly drawerOpen = signal(false);
  readonly cartItems = this.items.asReadonly();
  readonly isDrawerOpen = this.drawerOpen.asReadonly();

  add(item: CartItem): void {
    const normalizedItem = { ...item, id: productIdentity(item.id, item.name) };
    this.items.update(items => {
      const existing = items.find(current => current.id === normalizedItem.id);
      if (existing) {
        return items.map(current => current.id === normalizedItem.id
          ? { ...current, quantity: current.quantity + normalizedItem.quantity }
          : current);
      }
      return [...items, normalizedItem];
    });
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  toggleDrawer(): void {
    this.drawerOpen.update(isOpen => !isOpen);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  remove(itemId: string): void {
    this.items.update(items => items.filter(item => item.id !== productIdentity(itemId, '')));
  }

  updateQuantity(itemId: string, quantity: number): void {
    const nextQuantity = Math.max(1, Number(quantity) || 1);
    const normalizedId = productIdentity(itemId, '');
    this.items.update(items => items.map(item => item.id === normalizedId ? { ...item, quantity: nextQuantity } : item));
  }
}
