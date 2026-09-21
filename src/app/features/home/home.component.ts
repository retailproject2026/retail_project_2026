import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, ProductService } from '../../core/services/product.service';

interface ProductCard {
  id: string;
  name: string;
  price: string;
  category: string;
  tag?: string;
  tone: string;
  fabric: string;
  description: string;
  mainImageUrl: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly clothingCategories = ['Women', 'Men', 'Kids'];
  readonly otherCategories = ['Accessories', 'Occasionwear'];
  activeSlide = 0;
  loading = true;
  errorMessage = '';
  private slideTimer?: ReturnType<typeof setInterval>;
  private allProducts: ProductCard[] = [];

  newArrivals: ProductCard[] = [];
  featured: ProductCard[] = [];

  constructor(
    private readonly changeDetector: ChangeDetectorRef,
    private readonly productService: ProductService
  ) {}

  get carouselProducts(): ProductCard[] {
    return [...this.newArrivals, ...this.featured];
  }

  productsFor(category: string): ProductCard[] {
    return this.allProducts.filter(product => product.category === category);
  }

  ngOnInit(): void {
    this.productService.getProductList().then(products => {
      this.allProducts = products.map(product => this.toCard(product));
      this.newArrivals = this.allProducts.filter(product => product.tag === 'NEW').slice(0, 4);
      if (!this.newArrivals.length) this.newArrivals = this.allProducts.slice(0, 4);
      this.featured = this.allProducts.filter(product => product.tag === 'FEATURED').slice(0, 4);
      if (!this.featured.length) this.featured = this.allProducts.filter(product => !this.newArrivals.includes(product)).slice(0, 4);
      this.loading = false;
      this.startAutoPlay();
      this.changeDetector.markForCheck();
    }).catch(() => {
      this.errorMessage = 'Unable to load featured products right now.';
      this.loading = false;
      this.changeDetector.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
  }

  nextSlide(): void {
    this.activeSlide = (this.activeSlide + 1) % this.carouselProducts.length;
    this.changeDetector.markForCheck();
  }

  previousSlide(): void {
    this.activeSlide = (this.activeSlide - 1 + this.carouselProducts.length) % this.carouselProducts.length;
    this.restartAutoPlay();
    this.changeDetector.markForCheck();
  }

  selectSlide(index: number): void {
    this.activeSlide = index;
    this.restartAutoPlay();
    this.changeDetector.markForCheck();
  }

  private startAutoPlay(): void {
    this.slideTimer = setInterval(() => this.nextSlide(), 4000);
  }

  private restartAutoPlay(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
    this.startAutoPlay();
  }

  private toCard(product: Product): ProductCard {
    return {
      id: product.id,
      category: product.category,
      name: product.name,
      price: `${product.currency === 'INR' ? '₹' : product.currency ?? ''}${(product.salePrice ?? product.price).toLocaleString('en-IN')}`,
      tag: product.isNew ? 'NEW' : product.isFeatured ? 'FEATURED' : undefined,
      tone: product.tone,
      fabric: product.fabric ?? '',
      description: product.description,
      mainImageUrl: product.mainImageUrl
    };
  }
}
