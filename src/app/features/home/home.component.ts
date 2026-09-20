import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

interface ProductCard {
  id: string;
  name: string;
  price: string;
  tag?: string;
  tone: string;
  fabric: string;
  description: string;
  mainImageUrl: string;
}

interface HeroSlide {
  eyebrow: string;
  title: string;
  description: string;
  tone: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  priceRanges = ['Under ₹2,000', 'Under ₹5,000', '₹5,000 – ₹15,000', '₹15,000 – ₹35,000', 'Above ₹35,000'];
  activeSlide = 0;
  private slideTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly changeDetector: ChangeDetectorRef) {}

  heroSlides: HeroSlide[] = [
    {
      eyebrow: 'THE ART OF THE DRAPE',
      title: 'Timeless Silk.\nModern Elegance.',
      description: 'Discover handpicked sarees crafted for celebrations, traditions and everyday elegance.',
      tone: 'hero-plum'
    },
    {
      eyebrow: 'NEW SEASON / 2026',
      title: 'Colour\nThat Lingers.',
      description: 'Meet jewel-toned weaves designed to make every entrance unforgettable.',
      tone: 'hero-coral'
    },
    {
      eyebrow: 'HANDWOVEN HERITAGE',
      title: 'Woven By\nGenerations.',
      description: 'Explore Kanjivaram classics where every thread carries a story worth wearing.',
      tone: 'hero-indigo'
    },
    {
      eyebrow: 'THE FESTIVE EDIT',
      title: 'Made For\nYour Moment.',
      description: 'Elegant silk cottons and statement drapes for the celebrations ahead.',
      tone: 'hero-green'
    }
  ];

  newArrivals: ProductCard[] = [
    { id: 'saree-001', name: 'Lavender Peacock Zari Kanjivaram', price: '₹35,995', tag: 'NEW', tone: 'lavender', fabric: 'Pure Kanjivaram Silk', description: 'A graceful lavender drape with peacock zari details, handwoven for celebrations.', mainImageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=85' },
    { id: 'saree-002', name: 'Classic Orange Kanjivaram Silk', price: '₹32,495', tag: 'NEW', tone: 'orange', fabric: 'Pure Kanjivaram Silk', description: 'A vivid orange silk saree finished with a traditional zari border.', mainImageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=85' },
    { id: 'saree-003', name: 'Sunshine Yellow Kanjivaram', price: '₹9,795', tag: 'NEW', tone: 'yellow', fabric: 'Silk Cotton', description: 'A bright, lightweight weave designed for effortless festive dressing.', mainImageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=85' },
    { id: 'saree-004', name: 'Navy Blue Kanjivaram Silk', price: '₹9,795', tag: 'NEW', tone: 'navy', fabric: 'Kanjivaram Silk', description: 'Deep navy silk with a polished finish and timeless temple-inspired details.', mainImageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=85' }
  ];

  featured: ProductCard[] = [
    { id: 'saree-005', name: 'Mango Yellow Silk Cotton', price: '₹5,795', tone: 'mango', fabric: 'Silk Cotton', description: 'A warm mango yellow weave that brings an easy glow to every occasion.', mainImageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=85' },
    { id: 'saree-006', name: 'Teal Green Silk Cotton', price: '₹5,795', tone: 'teal', fabric: 'Silk Cotton', description: 'A rich teal drape with a soft texture and an elegant everyday fall.', mainImageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=85' },
    { id: 'saree-007', name: 'Maroon Silk Cotton', price: '₹5,795', tone: 'maroon', fabric: 'Silk Cotton', description: 'A classic maroon silk cotton saree with understated festive character.', mainImageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=85' },
    { id: 'saree-008', name: 'Emerald Green Silk Cotton', price: '₹5,895', tone: 'emerald', fabric: 'Silk Cotton', description: 'A jewel-toned emerald weave made for memorable evening occasions.', mainImageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=85' }
  ];

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
  }

  nextSlide(): void {
    this.activeSlide = (this.activeSlide + 1) % this.heroSlides.length;
    this.changeDetector.markForCheck();
  }

  previousSlide(): void {
    this.activeSlide = (this.activeSlide - 1 + this.heroSlides.length) % this.heroSlides.length;
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
