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
  private readonly drawerOpen = signal(false);
  readonly cartItems = this.items.asReadonly();
  readonly isDrawerOpen = this.drawerOpen.asReadonly();

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
    this.items.update(items => items.filter(item => item.id !== itemId));
  }

  updateQuantity(itemId: string, quantity: number): void {
    const nextQuantity = Math.max(1, Number(quantity) || 1);
    this.items.update(items => items.map(item => item.id === itemId ? { ...item, quantity: nextQuantity } : item));
  }
}
