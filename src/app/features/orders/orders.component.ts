import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OrderRecord, OrderService, OrderStatus } from '../../core/services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent {
  private readonly orderService = inject(OrderService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly statuses: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  
  searchMode: 'orderNumber' | 'mobileNumber' = 'orderNumber';
  orderNumber = '';
  mobileNumber = '';
  ordersList: OrderRecord[] = [];
  selectedOrderId = '';
  mobileSearched = false;

  order: OrderRecord | null = null;
  selectedStatus: OrderStatus = 'Pending';
  loading = false;
  updating = false;
  errorMessage = '';
  successMessage = '';

  switchSearchMode(mode: 'orderNumber' | 'mobileNumber'): void {
    if (this.searchMode === mode) return;
    this.searchMode = mode;
    this.errorMessage = '';
    this.successMessage = '';
    this.changeDetector.markForCheck();
  }

  async findOrder(): Promise<void> {
    const trimmed = this.orderNumber.trim();
    if (!trimmed) {
      this.errorMessage = 'Please enter an order number.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.order = null;
    this.ordersList = [];
    this.selectedOrderId = '';

    try {
      this.order = await this.orderService.findByOrderNumber(trimmed);
      if (!this.order) {
        this.errorMessage = 'No order found with that order number.';
        this.changeDetector.markForCheck();
        return;
      }
      this.selectedOrderId = this.order.id;
      this.selectedStatus = this.order.status;
      this.changeDetector.markForCheck();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load the order.';
      this.changeDetector.markForCheck();
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }

  async findOrdersByMobile(): Promise<void> {
    const trimmed = this.mobileNumber.trim();
    const cleanDigits = trimmed.replace(/\D/g, '');
    if (!trimmed || cleanDigits.length < 10) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.ordersList = [];
    this.order = null;
    this.selectedOrderId = '';
    this.mobileSearched = true;

    try {
      const orders = await this.orderService.findByMobileNumber(trimmed);
      this.ordersList = orders;

      if (!orders.length) {
        this.errorMessage = `No orders found for mobile number ${trimmed}.`;
        this.changeDetector.markForCheck();
        return;
      }

      this.successMessage = `Found ${orders.length} order${orders.length > 1 ? 's' : ''} for ${trimmed}.`;
      // Automatically show the most recent order
      this.selectOrder(orders[0]);
      this.changeDetector.markForCheck();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load orders for this mobile number.';
      this.changeDetector.markForCheck();
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }

  selectOrder(selected: OrderRecord): void {
    this.order = selected;
    this.orderNumber = selected.order_number;
    this.selectedOrderId = selected.id;
    this.selectedStatus = selected.status;
    this.changeDetector.markForCheck();
  }

  async updateOrderStatus(): Promise<void> {
    if (!this.order) return;
    this.updating = true;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      await this.orderService.updateStatus(this.order.id, this.selectedStatus);
      this.order = { ...this.order, status: this.selectedStatus, updated_at: new Date().toISOString() };
      this.successMessage = `Order status updated to ${this.selectedStatus}.`;
      this.changeDetector.markForCheck();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to update order status.';
      this.changeDetector.markForCheck();
    } finally {
      this.updating = false;
    }
  }

  statusIndex(status: OrderStatus): number {
    return this.statuses.indexOf(status);
  }
}
