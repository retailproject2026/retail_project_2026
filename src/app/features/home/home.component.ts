import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Product, ProductService } from '../../core/services/product.service';
import { WishlistProduct, WishlistService } from '../../core/services/wishlist.service';

interface ProductCard {
  id: string;
  name: string;
  price: string;
  category: string;
  productType: string;
  tag?: string;
  tone: string;
  priceValue: number;
  fabric: string;
  description: string;
  mainImageUrl: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  activeSlide = 0;
  loading = true;
  errorMessage = '';
  private slideTimer?: ReturnType<typeof setInterval>;
  private allProducts: ProductCard[] = [];

  newArrivals: ProductCard[] = [];
  featured: ProductCard[] = [];

  constructor(
    private readonly changeDetector: ChangeDetectorRef,
    private readonly productService: ProductService,
    private readonly wishlist: WishlistService
  ) {}

  get carouselProducts(): ProductCard[] {
    return [...this.newArrivals, ...this.featured];
  }

  get clothingCategories(): string[] {
    return this.clothingCategoryOrder;
  }

  get otherCategories(): string[] {
    return this.categoryOrder
      .filter(category => !this.clothingCategoryOrder.includes(category));
  }

  private get categoryOrder(): string[] {
    return [...new Set(this.allProducts.map(product => product.category))];
  }

  private get clothingCategoryOrder(): string[] {
    return this.categoryOrder.filter(category =>
      this.allProducts.some(product => product.category === category && product.productType === 'Clothes')
    );
  }

  productsFor(category: string): ProductCard[] {
    return this.allProducts.filter(product => product.category === category).slice(0, 4);
  }

  isFavorite(product: ProductCard): boolean {
    return this.wishlist.isFavorite(product.id, product.name);
  }

  toggleFavorite(product: ProductCard, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const favorite: WishlistProduct = {
      id: product.id,
      name: product.name,
      price: product.priceValue,
      category: product.category,
      tone: product.tone,
      mainImageUrl: product.mainImageUrl
    };
    this.wishlist.toggle(favorite);
  }

  ngOnInit(): void {
    this.productService.getProductList({ activeOnly: true }).then(products => {
      this.allProducts = products.map(product => this.toCard(product));
      this.newArrivals = this.allProducts.filter(product => product.tag === 'NEW').slice(0, 4);
      if (!this.newArrivals.length) this.newArrivals = this.allProducts.slice(0, 4);
      this.featured = this.allProducts.filter(product => product.tag === 'FEATURED').slice(0, 4);
      if (!this.featured.length) this.featured = this.allProducts.filter(product => !this.newArrivals.includes(product)).slice(0, 4);
      this.loading = false;
      this.startAutoPlay();
      this.changeDetector.detectChanges();
    }).catch(() => {
      this.errorMessage = 'Unable to load featured products right now.';
      this.loading = false;
      this.changeDetector.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
  }

  nextSlide(fromUser = false): void {
    if (!this.carouselProducts.length) return;
    this.activeSlide = (this.activeSlide + 1) % this.carouselProducts.length;
    if (fromUser) {
      this.restartAutoPlay();
    }
    this.changeDetector.detectChanges();
  }

  previousSlide(): void {
    if (!this.carouselProducts.length) return;
    this.activeSlide = (this.activeSlide - 1 + this.carouselProducts.length) % this.carouselProducts.length;
    this.restartAutoPlay();
    this.changeDetector.detectChanges();
  }

  selectSlide(index: number): void {
    if (index < 0 || index >= this.carouselProducts.length) return;
    this.activeSlide = index;
    this.restartAutoPlay();
    this.changeDetector.detectChanges();
  }

  private startAutoPlay(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
    this.slideTimer = setInterval(() => {
      this.nextSlide(false);
    }, 3500);
  }

  private restartAutoPlay(): void {
    this.startAutoPlay();
  }

  private toCard(product: Product): ProductCard {
    return {
      id: product.id,
      category: product.category,
      productType: product.productType,
      name: product.name,
      price: `${product.currency === 'INR' ? '₹' : product.currency ?? ''}${(product.salePrice ?? product.price).toLocaleString('en-IN')}`,
      priceValue: product.salePrice ?? product.price,
      tag: product.isNew ? 'NEW' : product.isFeatured ? 'FEATURED' : undefined,
      tone: product.tone,
      fabric: product.fabric ?? '',
      description: product.description,
      mainImageUrl: product.mainImageUrl
    };
  }
}
