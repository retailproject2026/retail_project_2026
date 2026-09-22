import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { OrderRecord, OrderService, OrderStatus } from '../../core/services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, MatButtonModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent {
  private readonly orderService = inject(OrderService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly statuses: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  orderNumber = '';
  order: OrderRecord | null = null;
  selectedStatus: OrderStatus = 'Pending';
  loading = false;
  updating = false;
  errorMessage = '';
  successMessage = '';

  async findOrder(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.order = null;
    try {
      this.order = await this.orderService.findByOrderNumber(this.orderNumber);
      if (!this.order) {
        this.errorMessage = 'No order found with that order number.';
        this.changeDetector.markForCheck();
        return;
      }
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
