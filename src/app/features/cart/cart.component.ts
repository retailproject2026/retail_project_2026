import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RazorpayService } from '../../core/services/razorpay.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, DecimalPipe],
  templateUrl: './cart.component.html'
})
export class CartComponent {
  readonly cartTotal = 100;
  checkoutLoading = false;
  checkoutMessage = '';
  healthLoading = false;
  healthMessage = '';

  constructor(private readonly razorpayService: RazorpayService) {}

  async checkout(): Promise<void> {
    this.checkoutLoading = true;
    this.checkoutMessage = '';

    try {
      const payment = await this.razorpayService.openCheckout(this.cartTotal);
      this.checkoutMessage = payment
        ? `Payment started successfully. Payment ID: ${payment.razorpay_payment_id}`
        : 'Payment window closed.';
    } catch (error) {
      this.checkoutMessage = error instanceof Error ? error.message : 'Unable to start payment.';
    } finally {
      this.checkoutLoading = false;
    }
  }

  async checkBackend(): Promise<void> {
    this.healthLoading = true;
    this.healthMessage = '';

    try {
      const health = await this.razorpayService.checkHealth();
      this.healthMessage = health.success
        ? `Backend connected: ${health.service}`
        : 'Backend responded with an unhealthy status.';
    } catch (error) {
      this.healthMessage = error instanceof Error ? error.message : 'Backend is unreachable.';
    } finally {
      this.healthLoading = false;
    }
  }
}
