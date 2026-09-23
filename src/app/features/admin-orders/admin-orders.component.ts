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
  readonly paymentStatuses: string[] = ['Paid', 'Pending', 'Failed'];

  orders: OrderRecord[] = [];
  selectedStatuses: Record<string, OrderStatus> = {};
  loading = true;
  updatingOrderId = '';
  errorMessage = '';
  successMessage = '';

  // Filter state
  searchTerm = '';
  filterStatus = 'ALL';
  filterPaymentStatus = 'ALL';
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' = 'newest';

  ngOnInit(): void {
    this.loadOrders();
  }

  async loadOrders(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    try {
      this.orders = await this.orderService.findAll();
      this.selectedStatuses = Object.fromEntries(this.orders.map(order => [order.id, order.status]));
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load orders.';
    } finally {
      this.loading = false;
      this.changeDetector.detectChanges();
    }
  }

  get filteredOrders(): OrderRecord[] {
    const term = this.searchTerm.trim().toLowerCase();

    const results = this.orders.filter(order => {
      // 1. Delivery status filter
      if (this.filterStatus !== 'ALL' && order.status !== this.filterStatus) {
        return false;
      }

      // 2. Payment status filter
      if (this.filterPaymentStatus !== 'ALL') {
        const orderPayment = (order.payment_status || '').toLowerCase();
        if (orderPayment !== this.filterPaymentStatus.toLowerCase()) {
          return false;
        }
      }

      // 3. Search query filter
      if (term) {
        const orderNumberMatch = (order.order_number || '').toLowerCase().includes(term);
        const mobileMatch = (order.shipping_address?.['mobile_number'] || '').toLowerCase().includes(term);
        const addressMatch = (order.shipping_address?.['address_line1'] || '').toLowerCase().includes(term);
        const cityMatch = (order.shipping_address?.['city'] || '').toLowerCase().includes(term);
        const stateMatch = (order.shipping_address?.['state'] || '').toLowerCase().includes(term);
        const itemsMatch = order.items?.some(item => (item.product_name || '').toLowerCase().includes(term));

        if (!orderNumberMatch && !mobileMatch && !addressMatch && !cityMatch && !stateMatch && !itemsMatch) {
          return false;
        }
      }

      return true;
    });

    // 4. Sorting
    return results.sort((a, b) => {
      if (this.sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (this.sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (this.sortBy === 'highest') {
        return (b.total_amount ?? 0) - (a.total_amount ?? 0);
      }
      if (this.sortBy === 'lowest') {
        return (a.total_amount ?? 0) - (b.total_amount ?? 0);
      }
      return 0;
    });
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.filterStatus !== 'ALL' || this.filterPaymentStatus !== 'ALL' || this.sortBy !== 'newest';
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'ALL';
    this.filterPaymentStatus = 'ALL';
    this.sortBy = 'newest';
    this.changeDetector.detectChanges();
  }

  async updateStatus(order: OrderRecord): Promise<void> {
    const status = this.selectedStatuses[order.id];
    if (!status || status === order.status) return;
    this.updatingOrderId = order.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.changeDetector.detectChanges();
    try {
      await this.orderService.updateStatus(order.id, status);
      this.orders = this.orders.map(current => current.id === order.id
        ? { ...current, status, updated_at: new Date().toISOString() }
        : current);
      this.successMessage = `${order.order_number} is now ${status}.`;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to update order status.';
    } finally {
      this.updatingOrderId = '';
      this.changeDetector.detectChanges();
    }
  }
}
