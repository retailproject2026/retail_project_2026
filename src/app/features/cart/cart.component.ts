import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, DecimalPipe, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);

  get cartItems() {
    return this.cart.cartItems();
  }

  get cartTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  get cartCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  updateQuantity(id: string, qty: number): void {
    this.cart.updateQuantity(id, Number(qty) || 1);
  }

  removeItem(id: string): void {
    this.cart.remove(id);
  }

  proceedToCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}

