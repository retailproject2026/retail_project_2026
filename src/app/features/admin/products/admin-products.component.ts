import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Product, ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [DecimalPipe, RouterLink, MatButtonModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss'
})
export class AdminProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  products: Product[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';
  deletingId = '';
  togglingId = '';

  ngOnInit(): void {
    this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    try {
      this.products = await this.productService.getProductList({ activeOnly: false });
      this.changeDetector.markForCheck();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load products.';
    } finally {
      this.loading = false;
      this.changeDetector.detectChanges();
    }
  }

  async toggleActive(product: Product): Promise<void> {
    const nextState = product.isActive === false;
    this.togglingId = product.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.changeDetector.detectChanges();
    try {
      await this.productService.updateActiveStatus(product.id, nextState);
      product.isActive = nextState;
      this.successMessage = `"${product.name}" is now ${nextState ? 'Active' : 'Inactive'}.`;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to update product status.';
    } finally {
      this.togglingId = '';
      this.changeDetector.detectChanges();
    }
  }

  async deleteProduct(product: Product): Promise<void> {
    if (!confirm(`Delete ${product.name}?`)) return;
    this.deletingId = product.id;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      await this.productService.deleteProduct(product.id);
      this.products = this.products.filter(current => current.id !== product.id);
      this.successMessage = `${product.name} was deleted.`;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to delete product.';
    } finally {
      this.deletingId = '';
      this.changeDetector.markForCheck();
    }
  }
}
