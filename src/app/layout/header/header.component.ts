import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { RazorpayService } from '../../core/services/razorpay.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatBadgeModule, FormsModule, DecimalPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  wishlistOpen = false;
  accountOpen = false;
  searchOpen = false;
  searchQuery = '';
  readonly searchCatalog = [
    { name: 'Lavender Peacock Zari Kanjivaram', price: '₹35,995' },
    { name: 'Classic Orange Kanjivaram Silk', price: '₹32,495' },
    { name: 'Sunshine Yellow Kanjivaram', price: '₹9,795' },
    { name: 'Navy Blue Kanjivaram Silk', price: '₹9,795' },
    { name: 'Mango Yellow Silk Cotton', price: '₹5,795' },
    { name: 'Teal Green Silk Cotton', price: '₹5,795' },
    { name: 'Maroon Silk Cotton', price: '₹5,795' },
    { name: 'Emerald Green Silk Cotton', price: '₹5,895' }
  ];
  mobileNumber = '';
  notifyNewArrivals = false;
  loggedIn = false;
  menuOpen = false;
  checkoutLoading = false;
  checkoutMessage = '';
  addressOpen = false;
  deliveryAddress = { address: '', city: '', state: '', postalCode: '' };

  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly wishlist: WishlistService,
    private readonly cart: CartService
  ) {}

  get cartItems() {
    return this.cart.cartItems();
  }

  get wishlistItems() {
    return this.wishlist.wishlistItems().map(item => ({
      ...item,
      priceLabel: `₹${item.price.toLocaleString('en-IN')}`,
      status: 'Available'
    }));
  }

  get wishlistCount(): number {
    return this.wishlistItems.length;
  }

  get cartCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  get cartTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  get filteredProducts(): Array<{ name: string; price: string }> {
    const query = this.searchQuery.trim().toLowerCase();
    return query ? this.searchCatalog.filter(product => product.name.toLowerCase().includes(query)) : this.searchCatalog;
  }

  toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
  }

  closeSearch(): void {
    this.searchOpen = false;
  }

  toggleWishlist(): void {
    this.wishlistOpen = !this.wishlistOpen;
  }

  closeWishlist(): void {
    this.wishlistOpen = false;
  }

  cartOpen = false;

  toggleCart(): void {
    this.cartOpen = !this.cartOpen;
  }

  closeCart(): void {
    this.cartOpen = false;
  }

  removeCartItem(itemId: string): void {
    this.cart.remove(itemId);
  }

  async checkout(): Promise<void> {
    this.closeCart();
    this.addressOpen = true;
  }

  closeAddress(): void {
    if (!this.checkoutLoading) this.addressOpen = false;
  }

  async confirmCheckout(): Promise<void> {
    const { address, city, state, postalCode } = this.deliveryAddress;
    if (!address.trim() || !city.trim() || !state.trim() || !/^\d{6}$/.test(postalCode)) {
      return;
    }

    this.checkoutLoading = true;
    this.checkoutMessage = '';

    try {
      const payment = await this.razorpayService.openCheckout(this.cartTotal);
      this.checkoutMessage = payment
        ? `Payment successful. Payment ID: ${payment.razorpay_payment_id}`
        : 'Payment window closed.';
      this.closeCart();
      this.addressOpen = false;
    } catch (error) {
      this.checkoutMessage = error instanceof Error ? error.message : 'Unable to start payment.';
    } finally {
      this.checkoutLoading = false;
    }
  }

  toggleAccount(): void {
    this.accountOpen = !this.accountOpen;
  }

  closeAccount(): void {
    this.accountOpen = false;
  }

  login(event: SubmitEvent): void {
    const form = event.target as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    this.loggedIn = true;
  }

  removeWishlistItem(itemId: string): void {
    this.wishlist.remove(itemId);
  }
}
