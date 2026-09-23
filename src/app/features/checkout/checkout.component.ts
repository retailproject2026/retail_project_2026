import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { RazorpayService } from '../../core/services/razorpay.service';
import { AddressFormComponent, DeliveryAddress } from '../../shared/components/address-form/address-form.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, DecimalPipe, AddressFormComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {
  private readonly cart = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly razorpayService = inject(RazorpayService);
  private readonly router = inject(Router);

  deliveryAddress: DeliveryAddress = { address: '', city: '', state: '', postalCode: '', mobileNumber: '' };
  checkoutLoading = false;
  checkoutMessage = '';
  paymentSuccess = false;

  get cartItems() {
    return this.cart.cartItems();
  }

  get cartTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  get cartCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  async confirmCheckout(): Promise<void> {
    if (!this.cartItems.length) return;
    this.checkoutLoading = true;
    this.checkoutMessage = '';

    let orderInfo: { orderId: string; orderNumber: string } | null = null;
    try {
      orderInfo = await this.orderService.createPendingOrder(this.deliveryAddress, this.cartItems);
    } catch (orderError) {
      this.checkoutMessage = orderError instanceof Error ? orderError.message : 'Unable to create order.';
      this.checkoutLoading = false;
      return;
    }

    try {
      const payment = await this.razorpayService.openCheckout(this.cartTotal);
      if (payment) {
        await this.orderService.updatePaymentStatus(
          orderInfo.orderId,
          'Paid',
          'Confirmed',
          payment.razorpay_payment_id
        );
        this.checkoutMessage = `Payment successful. Order number: ${orderInfo.orderNumber}`;
        this.paymentSuccess = true;
        this.cart.clear();
        await this.router.navigate(['/orders']);
      } else {
        await this.orderService.updatePaymentStatus(orderInfo.orderId, 'Failed', 'Cancelled');
        this.checkoutMessage = `Payment was cancelled. Order ${orderInfo.orderNumber} payment status set to Failed.`;
        this.paymentSuccess = false;
      }
    } catch (paymentError) {
      if (orderInfo) {
        await this.orderService.updatePaymentStatus(orderInfo.orderId, 'Failed', 'Cancelled').catch(() => {});
      }
      this.checkoutMessage = paymentError instanceof Error ? paymentError.message : 'Payment failed.';
      this.paymentSuccess = false;
    } finally {
      this.checkoutLoading = false;
    }
  }
}
