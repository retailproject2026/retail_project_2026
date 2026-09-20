import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  handler: (response: RazorpayPaymentResponse) => void;
  modal: { ondismiss: () => void };
  theme: { color: string };
}

interface CreateOrderResponse {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  order?: { id?: string; amount?: number; currency?: string };
}

interface HealthResponse {
  success: boolean;
  service: string;
  razorpayConfigured: boolean;
}

interface RazorpayInstance {
  open(): void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

@Injectable({ providedIn: 'root' })
export class RazorpayService {
  private readonly apiUrl = 'https://retail-project-backend.onrender.com/api';
  private readonly scriptUrl = 'https://checkout.razorpay.com/v1/checkout.js';
  private readonly keyId = 'rzp_test_Te8ZLRQeOlYAZD';
  private scriptPromise?: Promise<void>;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly http: HttpClient
  ) {}

  async checkHealth(): Promise<HealthResponse> {
    try {
      return await firstValueFrom(
        this.http.post<HealthResponse>(`${this.apiUrl}/test-db`,{})
      );
    } catch (error) {
      throw this.toApiError(error, 'Checking backend health');
    }
  }

  async openCheckout(amountInRupees: number): Promise<RazorpayPaymentResponse | null> {
    let order: CreateOrderResponse;

    try {
      order = await firstValueFrom(
        this.http.post<CreateOrderResponse>(
          `${this.apiUrl}/create-order`,
          { amount: amountInRupees }
        )
      );
    } catch (error) {
      throw this.toApiError(error, 'Creating Razorpay order');
    }
    const orderId = order.order_id ?? order.order?.id ?? order.id;

    if (!orderId) {
      throw new Error('The payment server did not return a Razorpay order ID.');
    }

    await this.loadCheckoutScript();

    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay Checkout could not be loaded.'));
        return;
      }

      const checkout = new window.Razorpay({
        key: this.keyId,
        amount: order.amount ?? Math.round(amountInRupees),
        currency: order.currency ?? order.order?.currency ?? 'INR',
        name: 'SAREE SILKS & MORE',
        description: 'Saree collection purchase',
        order_id: orderId,
        handler: async (response) => {
          try {
            await firstValueFrom(
              this.http.post(
                `${this.apiUrl}/verify`,
                {
                  razorpay_order_id: response.razorpay_order_id ?? orderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                }
              )
            );
            resolve(response);
          } catch (error) {
            reject(this.toApiError(error, 'Verifying payment'));
          }
        },
        modal: { ondismiss: () => resolve(null) },
        theme: { color: '#720974' }
      });

      checkout.open();
    });
  }

  private toApiError(error: unknown, operation: string): Error {
    if (error instanceof HttpErrorResponse) {
      const serverMessage = typeof error.error === 'string'
        ? error.error
        : error.error?.message ?? error.message;
      return new Error(`${operation} failed (${error.status}): ${serverMessage}`);
    }

    return error instanceof Error ? error : new Error(`${operation} failed.`);
  }

  private loadCheckoutScript(): Promise<void> {
    if (window.Razorpay) {
      return Promise.resolve();
    }

    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = this.scriptUrl;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Unable to load Razorpay Checkout.'));
      this.document.body.appendChild(script);
    });

    return this.scriptPromise;
  }
}
