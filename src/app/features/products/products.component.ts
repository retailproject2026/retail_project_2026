import { ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WishlistProduct, WishlistService } from '../../core/services/wishlist.service';
import { Product, ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink, DecimalPipe, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly wishlist = inject(WishlistService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly batchSize = 10;
  private allProducts: Product[] = [];
  private currentPage = 0;
  private hasMoreRemoteProducts = true;

  displayedProducts: Product[] = [];
  loading = true;
  loadingMore = false;
  errorMessage = '';
  filterOpen = false;
  selectedProductTypes: string[] = [];
  selectedCategories: string[] = [];
  sortOption = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  readonly productTypes = ['Clothes', 'Food', 'Accessories'];
  readonly clothingCategories = ['Women', 'Men', 'Kids', 'Occasionwear'];
  readonly foodCategories = ['Breakfast', 'Beverages', 'Gifting'];
  readonly accessoryCategories = ['Accessories'];
  readonly categoryOptions = [...this.clothingCategories, ...this.foodCategories, ...this.accessoryCategories];
  readonly priceStep = 500;
  readonly priceFloor = 0;
  readonly priceCeiling = 10000;
  openFilterSection = 'type';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const category = params.get('category');
      const type = params.get('type');
      this.selectedCategories = category && this.categoryOptions.includes(category) ? [category] : [];
      this.selectedProductTypes = type && this.productTypes.includes(type) ? [type] : [];
      if (this.allProducts.length) {
        this.previewFilters();
      }
    });
    this.loadProducts();
  }

  get hasMoreProducts(): boolean {
    return this.displayedProducts.length < this.getFilteredProducts().length || this.hasMoreRemoteProducts;
  }

  get activeFilterCount(): number {
    return this.selectedProductTypes.length + this.selectedCategories.length + (this.sortOption ? 1 : 0)
      + (this.minPrice !== null ? 1 : 0) + (this.maxPrice !== null ? 1 : 0);
  }

  get visibleProductTypes(): string[] {
    return this.selectedProductTypes.length ? this.selectedProductTypes : this.productTypes;
  }

  showCategoryGroup(productType: string): boolean {
    return !this.selectedProductTypes.length || this.selectedProductTypes.includes(productType);
  }

  selectedCountFor(section: string): number {
    if (section === 'type') return this.selectedProductTypes.length;
    if (section === 'clothes') return this.selectedCategories.filter(category => this.clothingCategories.includes(category)).length;
    if (section === 'food') return this.selectedCategories.filter(category => this.foodCategories.includes(category)).length;
    if (section === 'accessories') return this.selectedCategories.filter(category => this.accessoryCategories.includes(category)).length;
    if (section === 'sort') return this.sortOption ? 1 : 0;
    return (this.minPrice !== null ? 1 : 0) + (this.maxPrice !== null ? 1 : 0);
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

  toggleFilterSection(section: string, event: Event): void {
    event.preventDefault();
    this.openFilterSection = this.openFilterSection === section ? '' : section;
  }

  toggleCategory(category: string): void {
    this.selectedCategories = this.selectedCategories.includes(category)
      ? this.selectedCategories.filter(selected => selected !== category)
      : [...this.selectedCategories, category];
    this.previewFilters();
  }

  toggleProductType(productType: string): void {
    this.selectedProductTypes = this.selectedProductTypes.includes(productType)
      ? this.selectedProductTypes.filter(selected => selected !== productType)
      : [...this.selectedProductTypes, productType];
    this.previewFilters();
  }

  updatePriceRange(): void {
    this.previewFilters();
  }

  setPriceFromSlider(bound: 'min' | 'max', event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (bound === 'min') {
      this.minPrice = Math.min(value, this.maxPrice ?? this.priceCeiling);
    } else {
      this.maxPrice = Math.max(value, this.minPrice ?? this.priceFloor);
    }
    this.updatePriceRange();
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
    this.selectedProductTypes = [];
    this.selectedCategories = [];
    this.sortOption = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.applyFilters();
  }

  private loadProducts(): void {
    this.currentPage = 0;
    this.productService.getProductListPage(this.currentPage, this.batchSize).then(page => {
      this.allProducts = page.products;
      this.hasMoreRemoteProducts = page.hasMore;
        this.displayedProducts = this.getFilteredProducts().slice(0, this.batchSize);
        this.loading = false;
        this.changeDetector.markForCheck();
      }).catch(() => {
        this.errorMessage = 'Unable to load products right now.';
        this.loading = false;
        this.changeDetector.markForCheck();
      });
  }

  private loadNextBatch(): void {
    if (this.loading || this.loadingMore || !this.hasMoreProducts) {
      return;
    }

    this.loadingMore = true;
    const nextCount = this.displayedProducts.length + this.batchSize;
    const nextPage = this.currentPage + 1;

    if (this.hasMoreRemoteProducts) {
      this.productService.getProductListPage(nextPage, this.batchSize).then(page => {
        this.currentPage = nextPage;
        this.hasMoreRemoteProducts = page.hasMore;
        this.allProducts = [...this.allProducts, ...page.products];
        this.displayedProducts = this.getFilteredProducts().slice(0, nextCount);
      }).catch(() => {
        this.errorMessage = 'Unable to load more products right now.';
      }).finally(() => {
        this.loadingMore = false;
        this.changeDetector.markForCheck();
      });
      return;
    }

    this.displayedProducts = this.getFilteredProducts().slice(0, nextCount);
    this.loadingMore = false;
    this.changeDetector.markForCheck();
  }

  private getFilteredProducts(): Product[] {
    const byType = this.selectedProductTypes.length
      ? this.allProducts.filter(product => this.selectedProductTypes.includes(product.productType))
      : this.allProducts;
    const filtered = this.selectedCategories.length
      ? byType.filter(product => this.selectedCategories.includes(product.category))
      : [...byType];

    const priceFiltered = filtered.filter(product =>
      (this.minPrice === null || product.price >= this.minPrice)
      && (this.maxPrice === null || product.price <= this.maxPrice)
    );

    return priceFiltered.sort((first, second) => {
      if (this.sortOption === 'price-low') return first.price - second.price;
      if (this.sortOption === 'price-high') return second.price - first.price;
      if (this.sortOption === 'name') return first.name.localeCompare(second.name);
      return 0;
    });
  }
}
