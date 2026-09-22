import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { OrderRecord, OrderService, OrderStatus } from '../../core/services/order.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, MatButtonModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss'
})
export class AdminOrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly statuses: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  orders: OrderRecord[] = [];
  selectedStatuses: Record<string, OrderStatus> = {};
  loading = true;
  updatingOrderId = '';
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadOrders();
  }

  async loadOrders(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    try {
      this.orders = await this.orderService.findAll();
      this.selectedStatuses = Object.fromEntries(this.orders.map(order => [order.id, order.status]));
      this.changeDetector.markForCheck();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load orders.';
      this.changeDetector.markForCheck();
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }

  async updateStatus(order: OrderRecord): Promise<void> {
    const status = this.selectedStatuses[order.id];
    if (!status || status === order.status) return;
    this.updatingOrderId = order.id;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      await this.orderService.updateStatus(order.id, status);
      this.orders = this.orders.map(current => current.id === order.id
        ? { ...current, status, updated_at: new Date().toISOString() }
        : current);
      this.successMessage = `${order.order_number} is now ${status}.`;
      this.changeDetector.markForCheck();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to update order status.';
      this.changeDetector.markForCheck();
    } finally {
      this.updatingOrderId = '';
    }
  }
}
