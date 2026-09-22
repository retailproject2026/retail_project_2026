import { Component, OnInit } from '@angular/core';
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
import { ProductService } from '../../core/services/product.service';
import { AddressFormComponent, DeliveryAddress } from '../../shared/components/address-form/address-form.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatBadgeModule, FormsModule, DecimalPipe, AddressFormComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  wishlistOpen = false;
  accountOpen = false;
  searchOpen = false;
  searchQuery = '';
  readonly wishlistQuantities: Record<string, number> = {};
  searchCatalog: Array<{ id: string; name: string; price: string }> = [];
  mobileNumber = '';
  notifyNewArrivals = false;
  loggedIn = false;
  menuOpen = false;
  clothesOpen = false;
  checkoutLoading = false;
  checkoutMessage = '';
  addressOpen = false;
  deliveryAddress: DeliveryAddress = { address: '', city: '', state: '', postalCode: '', mobileNumber: '' };

  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly wishlist: WishlistService,
    private readonly cart: CartService,
    private readonly productService: ProductService
  ) {}

  ngOnInit(): void {
    this.productService.getProductList().then(products => {
      this.searchCatalog = products.map(product => ({
        id: product.id,
        name: product.name,
        price: `${product.currency === 'INR' ? '₹' : product.currency ?? ''}${(product.salePrice ?? product.price).toLocaleString('en-IN')}`
      }));
    }).catch(() => {
      this.searchCatalog = [];
    });
  }

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

  get wishlistTotal(): number {
    return this.wishlistItems.reduce((total, item) => total + item.price, 0);
  }

  get cartCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  get cartTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  getWishlistQuantity(itemId: string): number {
    return this.wishlistQuantities[itemId] ?? 1;
  }

  setWishlistQuantity(itemId: string, quantity: number): void {
    this.wishlistQuantities[itemId] = Math.max(1, Number(quantity) || 1);
  }

  addWishlistItemToCart(itemId: string): void {
    const item = this.wishlist.wishlistItems().find(current => current.id === itemId);
    if (!item) return;

    this.cart.add({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: this.getWishlistQuantity(itemId),
      tone: item.tone,
      mainImageUrl: item.mainImageUrl
    });
    this.closeWishlist();
    this.cart.openDrawer();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
    this.clothesOpen = false;
  }

  toggleClothes(): void {
    this.clothesOpen = !this.clothesOpen;
  }

  get filteredProducts(): Array<{ id: string; name: string; price: string }> {
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

  checkoutWishlist(): void {
    const items = this.wishlist.wishlistItems();
    if (!items.length) return;

    items.forEach(item => {
      this.cart.add({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: this.getWishlistQuantity(item.id),
        tone: item.tone,
        mainImageUrl: item.mainImageUrl
      });
    });

    this.closeWishlist();
    this.checkout();
  }

  get cartOpen(): boolean {
    return this.cart.isDrawerOpen();
  }

  toggleCart(): void {
    this.cart.toggleDrawer();
  }

  closeCart(): void {
    this.cart.closeDrawer();
  }

  removeCartItem(itemId: string): void {
    this.cart.remove(itemId);
  }

  updateCartQuantity(itemId: string, quantity: number): void {
    this.cart.updateQuantity(itemId, quantity);
  }

  async checkout(): Promise<void> {
    this.closeCart();
    this.addressOpen = true;
  }

  closeAddress(): void {
    if (!this.checkoutLoading) this.addressOpen = false;
  }

  async confirmCheckout(): Promise<void> {
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
