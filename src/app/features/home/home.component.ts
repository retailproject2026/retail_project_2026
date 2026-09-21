import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  readonly categories = ['Women', 'Men', 'Kids', 'Accessories', 'Occasionwear'];
  activeSlide = 0;
  private slideTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly changeDetector: ChangeDetectorRef) {}

  newArrivals: ProductCard[] = [
    { id: 'women-001', category: 'Women', name: 'Floral Shirt Dress', price: '₹3,299', tag: 'NEW', tone: 'lavender', fabric: 'Cotton Blend', description: 'A breezy floral shirt dress with a relaxed silhouette and everyday versatility.', mainImageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85' },
    { id: 'men-001', category: 'Men', name: 'Linen Overshirt', price: '₹3,199', tag: 'NEW', tone: 'orange', fabric: 'Linen Blend', description: 'A relaxed overshirt with breathable texture and a polished casual finish.', mainImageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85' },
    { id: 'kids-001', category: 'Kids', name: 'Mini Graphic Tee', price: '₹1,499', tag: 'NEW', tone: 'yellow', fabric: 'Cotton Jersey', description: 'A cheerful tee with playful graphics designed for happy everyday wear.', mainImageUrl: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=900&q=85' },
    { id: 'women-005', category: 'Women', name: 'Satin Evening Gown', price: '₹6,999', tag: 'NEW', tone: 'navy', fabric: 'Satin', description: 'A statement gown with a graceful drape and a luxe finish for special evenings.', mainImageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85' }
  ];

  featured: ProductCard[] = [
    { id: 'accessories-001', category: 'Accessories', name: 'Leather Sling Bag', price: '₹2,299', tone: 'mango', fabric: 'Genuine Leather', description: 'A compact sling bag with a clean silhouette and everyday carry comfort.', mainImageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85' },
    { id: 'occasionwear-002', category: 'Occasionwear', name: 'Festive Anarkali Suit', price: '₹6,499', tone: 'teal', fabric: 'Silk Blend', description: 'A festive anarkali with graceful movement and a rich statement silhouette.', mainImageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85' },
    { id: 'men-005', category: 'Men', name: 'Heritage Bomber Jacket', price: '₹5,799', tone: 'maroon', fabric: 'Wool Blend', description: 'A structured bomber with heritage detailing and a soft lined finish.', mainImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85' },
    { id: 'women-003', category: 'Women', name: 'Pleated Co-ord Set', price: '₹3,899', tone: 'emerald', fabric: 'Poly Blend', description: 'A vibrant pleated co-ord that balances ease and elevated design for daily outings.', mainImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85' }
  ];

  get carouselProducts(): ProductCard[] {
    return [...this.newArrivals, ...this.featured];
  }

  productsFor(category: string): ProductCard[] {
    return this.carouselProducts.filter(product => product.category === category);
  }

  ngOnInit(): void {
    this.startAutoPlay();
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
}
