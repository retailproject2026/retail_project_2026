import { ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WishlistProduct, WishlistService } from '../../core/services/wishlist.service';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  fabric: string;
  color: string;
  description: string;
  tone: string;
  mainImageUrl: string;
  extraImageUrls: string[];
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink, DecimalPipe, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly wishlist = inject(WishlistService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly productSource = 'products.json';
  private readonly batchSize = 10;
  private allProducts: Product[] = [];

  displayedProducts: Product[] = [];
  loading = true;
  loadingMore = false;
  errorMessage = '';
  filterOpen = false;
  selectedCategories: string[] = [];
  sortOption = '';
  readonly categoryOptions = ['Women', 'Men', 'Kids', 'Accessories', 'Occasionwear'];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const category = params.get('category');
      this.selectedCategories = category && this.categoryOptions.includes(category) ? [category] : [];
      if (this.allProducts.length) {
        this.previewFilters();
      }
    });
    this.loadProducts();
  }

  get hasMoreProducts(): boolean {
    return this.displayedProducts.length < this.getFilteredProducts().length;
  }

  get activeFilterCount(): number {
    return this.selectedCategories.length + (this.sortOption ? 1 : 0);
  }

  get productCount(): number {
    return this.getFilteredProducts().length;
  }

  isFavorite(product: Product): boolean {
    return this.wishlist.isFavorite(product.id);
  }

  toggleFavorite(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const favorite: WishlistProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      tone: product.tone,
      mainImageUrl: product.mainImageUrl
    };
    this.wishlist.toggle(favorite);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 240;
    if (nearBottom) {
      this.loadNextBatch();
    }
  }

  toggleFilters(): void { this.filterOpen = !this.filterOpen; }
  closeFilters(): void { this.filterOpen = false; }

  toggleCategory(category: string): void {
    this.selectedCategories = this.selectedCategories.includes(category)
      ? this.selectedCategories.filter(selected => selected !== category)
      : [...this.selectedCategories, category];
    this.previewFilters();
  }

  previewFilters(): void {
    this.displayedProducts = this.getFilteredProducts().slice(0, this.batchSize);
    this.changeDetector.markForCheck();
  }

  applyFilters(): void {
    this.previewFilters();
    this.closeFilters();
    this.changeDetector.markForCheck();
  }

  resetFilters(): void {
    this.selectedCategories = [];
    this.sortOption = '';
    this.applyFilters();
  }

  private loadProducts(): void {
    this.http.get<Product[]>(this.productSource).subscribe({
      next: products => {
        this.allProducts = products;
        this.displayedProducts = this.getFilteredProducts().slice(0, this.batchSize);
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load products right now.';
        this.loading = false;
        this.changeDetector.markForCheck();
      }
    });
  }

  private loadNextBatch(): void {
    if (this.loading || this.loadingMore || !this.hasMoreProducts) {
      return;
    }

    this.loadingMore = true;
    const nextCount = this.displayedProducts.length + this.batchSize;
    this.displayedProducts = this.getFilteredProducts().slice(0, nextCount);
    this.loadingMore = false;
    this.changeDetector.markForCheck();
  }

  private getFilteredProducts(): Product[] {
    const filtered = this.selectedCategories.length
      ? this.allProducts.filter(product => this.selectedCategories.includes(product.category))
      : [...this.allProducts];

    return filtered.sort((first, second) => {
      if (this.sortOption === 'price-low') return first.price - second.price;
      if (this.sortOption === 'price-high') return second.price - first.price;
      if (this.sortOption === 'name') return first.name.localeCompare(second.name);
      return 0;
    });
  }
}
