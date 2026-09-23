import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Product, ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [DecimalPipe, RouterLink, MatButtonModule, FormsModule],
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

  // Filter & Search state
  searchTerm = '';
  filterStatus: 'ALL' | 'active' | 'inactive' = 'ALL';
  filterStock: 'ALL' | 'in_stock' | 'out_of_stock' = 'ALL';
  filterType = 'ALL';
  sortBy: 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' = 'name_asc';

  ngOnInit(): void {
    this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    try {
      this.products = await this.productService.getProductList({ activeOnly: false });
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load products.';
    } finally {
      this.loading = false;
      this.changeDetector.detectChanges();
    }
  }

  get availableProductTypes(): string[] {
    const types = new Set<string>();
    for (const p of this.products) {
      if (p.productType?.trim()) {
        types.add(p.productType.trim());
      }
    }
    return Array.from(types).sort();
  }

  get filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();

    const results = this.products.filter(product => {
      // 1. Status filter (Active vs Inactive)
      if (this.filterStatus === 'active' && product.isActive === false) {
        return false;
      }
      if (this.filterStatus === 'inactive' && product.isActive !== false) {
        return false;
      }

      // 2. Stock filter
      const isProductInStock = product.inStock !== false && (product.stock ?? 1) > 0;
      if (this.filterStock === 'in_stock' && !isProductInStock) {
        return false;
      }
      if (this.filterStock === 'out_of_stock' && isProductInStock) {
        return false;
      }

      // 3. Product Type filter
      if (this.filterType !== 'ALL' && product.productType?.toLowerCase() !== this.filterType.toLowerCase()) {
        return false;
      }

      // 4. Search query filter
      if (term) {
        const nameMatch = (product.name || '').toLowerCase().includes(term);
        const skuMatch = (product.sku || '').toLowerCase().includes(term);
        const categoryMatch = (product.category || '').toLowerCase().includes(term);
        const typeMatch = (product.productType || '').toLowerCase().includes(term);

        if (!nameMatch && !skuMatch && !categoryMatch && !typeMatch) {
          return false;
        }
      }

      return true;
    });

    // 5. Sorting
    return results.sort((a, b) => {
      if (this.sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (this.sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (this.sortBy === 'price_asc') {
        const priceA = a.salePrice ?? a.price ?? 0;
        const priceB = b.salePrice ?? b.price ?? 0;
        return priceA - priceB;
      }
      if (this.sortBy === 'price_desc') {
        const priceA = a.salePrice ?? a.price ?? 0;
        const priceB = b.salePrice ?? b.price ?? 0;
        return priceB - priceA;
      }
      if (this.sortBy === 'stock_asc') {
        return (a.stock ?? 0) - (b.stock ?? 0);
      }
      if (this.sortBy === 'stock_desc') {
        return (b.stock ?? 0) - (a.stock ?? 0);
      }
      return 0;
    });
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() ||
      this.filterStatus !== 'ALL' ||
      this.filterStock !== 'ALL' ||
      this.filterType !== 'ALL' ||
      this.sortBy !== 'name_asc';
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'ALL';
    this.filterStock = 'ALL';
    this.filterType = 'ALL';
    this.sortBy = 'name_asc';
    this.changeDetector.detectChanges();
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
      this.changeDetector.detectChanges();
    }
  }
}
