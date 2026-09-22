import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CreateProductInput, ProductService } from '../../../core/services/product.service';

interface ProductFormModel {
  id: string;
  sku: string;
  sale_price: number | null;
  currency: string;
  product_type: string;
  brand: string;
  stock: number | null;
  inStock: boolean;
  attributes: string;
  rating: number | null;
  review_count: number | null;
  is_featured: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
  name: string;
  price: number | null;
  category: string;
  fabric: string;
  color: string;
  description: string;
  tone: string;
  main_image_url: string;
  extra_image_urls: string;
  extra_image_url1: string;
  extra_image_url2: string;
}

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule],
  templateUrl: './product-create.component.html',
  styleUrl: './product-create.component.scss'
})
export class ProductCreateComponent {
  private readonly productService = inject(ProductService);
  readonly uuidPattern = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$';
  readonly productTypes = ['Clothes', 'Food', 'Accessories'];
  readonly categories = ['Women', 'Men', 'Kids', 'Occasionwear', 'Breakfast', 'Beverages', 'Gifting', 'Accessories'];
  form: ProductFormModel = this.createInitialForm();
  submitting = false;
  successMessage = '';
  errorMessage = '';

  async submit(formElement: NgForm): Promise<void> {
    this.successMessage = '';
    this.errorMessage = '';
    if (formElement.invalid) {
      formElement.control.markAllAsTouched();
      return;
    }

    let attributes: Record<string, string | string[]>;
    let extraImageUrls: string[];
    try {
      attributes = this.parseAttributes(this.form.attributes);
      extraImageUrls = this.parseImageUrls(this.form.extra_image_urls);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Check the JSON fields and try again.';
      return;
    }

    const product: CreateProductInput = {
      ...this.form,
      sale_price: this.form.sale_price,
      stock: this.form.stock ?? 0,
      rating: this.form.rating,
      review_count: this.form.review_count ?? 0,
      price: this.form.price ?? 0,
      attributes,
      extra_image_urls: extraImageUrls
    };

    this.submitting = true;
    try {
      await this.productService.createProduct(product);
      this.successMessage = 'Product created successfully.';
      this.form = this.createInitialForm();
      formElement.resetForm(this.form);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to create product.';
    } finally {
      this.submitting = false;
    }
  }

  private parseAttributes(value: string): Record<string, string | string[]> {
    if (!value.trim()) return {};
    const parsed: unknown = JSON.parse(value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error('Attributes must be a JSON object.');
    }
    return parsed as Record<string, string | string[]>;
  }

  private parseImageUrls(value: string): string[] {
    if (!value.trim()) return [];
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'string')) {
      throw new Error('Extra image URLs must be a JSON array of strings.');
    }
    return parsed;
  }

  private createInitialForm(): ProductFormModel {
    const now = new Date().toISOString().slice(0, 16);
    return {
      id: crypto.randomUUID(), sku: '', sale_price: null, currency: 'INR', product_type: 'Clothes',
      brand: '', stock: 0, inStock: true, attributes: '{}', rating: null, review_count: 0,
      is_featured: false, is_new: false, created_at: now, updated_at: now, name: '', price: null,
      category: 'Women', fabric: '', color: '', description: '', tone: 'default', main_image_url: '',
      extra_image_urls: '[]', extra_image_url1: '', extra_image_url2: ''
    };
  }
}
