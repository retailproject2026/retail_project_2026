import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { WishlistService, WishlistProduct } from '../../core/services/wishlist.service';
import { RazorpayService } from '../../core/services/razorpay.service';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  fabric: string;
  color: string;
  description: string;
  mainImageUrl: string;
  extraImageUrls: string[];
  tone: string;
}

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink, DecimalPipe, FormsModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly razorpay = inject(RazorpayService);
  readonly id = this.route.snapshot.paramMap.get('id');
  product: Product | null = null;
  loading = true;
  errorMessage = '';
  relatedProducts: Product[] = [];
  activeImageIndex = 0;
  quantity = 1;
  actionMessage = '';
  checkoutLoading = false;
  shippingOpen = false;
  helpOpen = false;
  addressOpen = false;
  deliveryAddress = { address: '', city: '', state: '', postalCode: '' };

  get isFavorite(): boolean {
    return this.product ? this.wishlist.isFavorite(this.product.id) : false;
  }

  ngOnInit(): void {
    this.http.get<Product[]>('products.json').subscribe({
      next: products => {
        this.product = products.find(item => item.id === this.id) ?? null;
        this.relatedProducts = this.product
          ? products.filter(item => item.id !== this.product?.id)
          : [];
        this.errorMessage = this.product ? '' : 'Product not found.';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load product details.';
        this.loading = false;
        this.changeDetector.markForCheck();
      }
    });
  }

  addToCart(): void {
    if (!this.product) return;
    this.cart.add({
      id: this.product.id,
      name: this.product.name,
      price: this.product.price,
      quantity: this.quantity,
      tone: 'cart-product',
      mainImageUrl: this.product.mainImageUrl
    });
    this.actionMessage = `${this.quantity} item${this.quantity > 1 ? 's' : ''} added to your bag.`;
  }

  toggleWishlist(): void {
    if (!this.product) return;
    const favorite: WishlistProduct = {
      id: this.product.id,
      name: this.product.name,
      price: this.product.price,
      category: this.product.category,
      tone: 'wishlist-product',
      mainImageUrl: this.product.mainImageUrl
    };
    this.wishlist.toggle(favorite);
  }

  async buyNow(): Promise<void> {
    if (!this.product) return;
    this.addressOpen = true;
  }

  closeAddress(): void {
    if (!this.checkoutLoading) this.addressOpen = false;
  }

  async confirmBuyNow(): Promise<void> {
    if (!this.product || !this.deliveryAddress.address.trim() || !this.deliveryAddress.city.trim() || !this.deliveryAddress.state.trim() || !/^\d{6}$/.test(this.deliveryAddress.postalCode)) return;
    this.checkoutLoading = true;
    this.actionMessage = '';
    try {
      const payment = await this.razorpay.openCheckout(this.product.price * this.quantity);
      this.actionMessage = payment
        ? `Payment successful. Payment ID: ${payment.razorpay_payment_id}`
        : 'Payment window closed.';
      this.addressOpen = false;
    } catch (error) {
      this.actionMessage = error instanceof Error ? error.message : 'Unable to start payment.';
    } finally {
      this.checkoutLoading = false;
    }
  }

  get galleryImages(): string[] {
    return this.product ? [this.product.mainImageUrl, ...this.product.extraImageUrls] : [];
  }

  previousImage(): void {
    this.activeImageIndex = (this.activeImageIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
  }

  nextImage(): void {
    this.activeImageIndex = (this.activeImageIndex + 1) % this.galleryImages.length;
  }

  selectImage(index: number): void {
    this.activeImageIndex = index;
  }

  toggleShipping(): void {
    this.shippingOpen = !this.shippingOpen;
  }

  toggleHelp(): void {
    this.helpOpen = !this.helpOpen;
  }
}
