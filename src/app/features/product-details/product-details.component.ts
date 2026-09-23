import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { WishlistService, WishlistProduct } from '../../core/services/wishlist.service';
import { RazorpayService } from '../../core/services/razorpay.service';
import { Product, ProductService } from '../../core/services/product.service';
import { AddressFormComponent, DeliveryAddress } from '../../shared/components/address-form/address-form.component';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink, DecimalPipe, FormsModule, AddressFormComponent],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly razorpay = inject(RazorpayService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  product: Product | null = null;
  loading = true;
  errorMessage = '';
  relatedProducts: Product[] = [];
  activeImageIndex = 0;
  quantity = 1;
  actionMessage = '';
  checkoutLoading = false;
  paymentSuccess = false;
  shippingOpen = false;
  helpOpen = false;
  addressOpen = false;
  deliveryAddress: DeliveryAddress = { address: '', city: '', state: '', postalCode: '', mobileNumber: '' };

  get isFavorite(): boolean {
    return this.product ? this.wishlist.isFavorite(this.product.id, this.product.name) : false;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => this.loadProduct(params.get('id')));
  }

  private loadProduct(id: string | null): void {
    this.loading = true;
    this.product = null;
    this.relatedProducts = [];

    if (!id) {
      this.errorMessage = 'Product not found.';
      this.loading = false;
      return;
    }

    this.productService.getProductById(id).then(product => {
        if (product && product.isActive === false) {
          this.product = null;
          this.errorMessage = 'This product is currently unavailable.';
        } else {
          this.product = product;
          this.errorMessage = this.product ? '' : 'Product not found.';
        }
        this.loading = false;
        this.changeDetector.markForCheck();
        if (this.product) {
          this.productService.getProductList({ activeOnly: true }).then(products => {
            const sameCategory = products.filter(item => item.id !== this.product?.id && item.category === this.product?.category);
            const otherProducts = products.filter(item => item.id !== this.product?.id && item.category !== this.product?.category);
            this.relatedProducts = [...sameCategory, ...otherProducts].slice(0, 4);
            this.changeDetector.markForCheck();
          }).catch(() => {
            this.relatedProducts = [];
          });
        }
      }).catch(() => {
        this.errorMessage = 'Unable to load product details.';
        this.loading = false;
        this.changeDetector.markForCheck();
      });
  }

  addToCart(): void {
    if (!this.product || this.product.inStock === false) return;
    this.cart.add({
      id: this.product.id,
      name: this.product.name,
      price: this.product.salePrice ?? this.product.price,
      quantity: this.quantity,
      tone: 'cart-product',
      mainImageUrl: this.product.mainImageUrl
    });
    this.cart.openDrawer();
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
    this.actionMessage = '';
    this.paymentSuccess = false;
    this.addressOpen = true;
  }

  closeAddress(): void {
    if (!this.checkoutLoading) this.addressOpen = false;
  }

  async confirmBuyNow(): Promise<void> {
    if (!this.product) return;
    this.checkoutLoading = true;
    this.actionMessage = '';

    let orderInfo: { orderId: string; orderNumber: string } | null = null;
    try {
      orderInfo = await this.orderService.createPendingOrder(this.deliveryAddress, [{
        id: this.product.id,
        name: this.product.name,
        price: this.product.salePrice ?? this.product.price,
        quantity: this.quantity,
        tone: this.product.tone,
        mainImageUrl: this.product.mainImageUrl
      }]);
    } catch (orderError) {
      this.actionMessage = orderError instanceof Error ? orderError.message : 'Unable to create order.';
      this.checkoutLoading = false;
      return;
    }

    try {
      const payment = await this.razorpay.openCheckout((this.product.salePrice ?? this.product.price) * this.quantity);
      if (payment) {
        await this.orderService.updatePaymentStatus(
          orderInfo.orderId,
          'Paid',
          'Confirmed',
          payment.razorpay_payment_id
        );
        this.actionMessage = `Payment successful. Order number: ${orderInfo.orderNumber}`;
        this.paymentSuccess = true;
        this.addressOpen = false;
        await this.router.navigate(['/orders']);
      } else {
        await this.orderService.updatePaymentStatus(orderInfo.orderId, 'Failed', 'Cancelled');
        this.actionMessage = `Payment was cancelled. Order ${orderInfo.orderNumber} payment status set to Failed.`;
        this.paymentSuccess = false;
      }
    } catch (error) {
      if (orderInfo) {
        await this.orderService.updatePaymentStatus(orderInfo.orderId, 'Failed', 'Cancelled').catch(() => {});
      }
      this.actionMessage = error instanceof Error ? error.message : 'Unable to complete payment.';
      this.paymentSuccess = false;
    } finally {
      this.checkoutLoading = false;
    }
  }

  get galleryImages(): string[] {
    return this.product ? [this.product.mainImageUrl, this.product.extraImageUrl1, this.product.extraImageUrl2] : [];
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
