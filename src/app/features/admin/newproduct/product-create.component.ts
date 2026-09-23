import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  is_active: boolean;
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
export class ProductCreateComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly uuidPattern = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$';
  readonly productTypes = ['Clothes', 'Food', 'Accessories'];
  readonly categories = ['Women', 'Men', 'Kids', 'Occasionwear', 'Breakfast', 'Beverages', 'Gifting', 'Accessories'];
  form: ProductFormModel = this.createInitialForm();
  submitting = false;
  successMessage = '';
  errorMessage = '';
  editingId: string | null = null;
  loadingProduct = false;
  uploadingImage: 'main' | 'extra1' | 'extra2' | null = null;

  ngOnInit(): void {
    this.editingId = this.route.snapshot.paramMap.get('id');
    if (this.editingId) this.loadProduct(this.editingId);
  }

  private async loadProduct(id: string): Promise<void> {
    this.loadingProduct = true;
    try {
      const product = await this.productService.getProductById(id);
      if (!product) {
        this.errorMessage = 'Product not found.';
        return;
      }
      this.form = {
        id: product.id,
        sku: product.sku ?? '',
        sale_price: product.salePrice ?? null,
        currency: product.currency ?? 'INR',
        product_type: product.productType,
        brand: product.brand ?? '',
        stock: product.stock ?? 0,
        inStock: product.inStock ?? false,
        attributes: JSON.stringify(product.attributes ?? {}, null, 2),
        rating: product.rating ?? null,
        review_count: product.reviewCount ?? 0,
        is_featured: product.isFeatured ?? false,
        is_new: product.isNew ?? false,
        is_active: product.isActive ?? true,
        created_at: this.toDateTimeLocal(product.createdAt),
        updated_at: this.toDateTimeLocal(product.updatedAt),
        name: product.name,
        price: product.price,
        category: product.category,
        fabric: product.fabric ?? '',
        color: product.color ?? '',
        description: product.description,
        tone: product.tone,
        main_image_url: product.mainImageUrl,
        extra_image_urls: JSON.stringify(product.extraImageUrls ?? [], null, 2),
        extra_image_url1: product.extraImageUrl1,
        extra_image_url2: product.extraImageUrl2
      };
      this.changeDetector.markForCheck();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load product.';
    } finally {
      this.loadingProduct = false;
      this.changeDetector.detectChanges();
    }
  }

  async submit(formElement: NgForm): Promise<void> {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.uploadingImage) {
      this.errorMessage = 'Please wait for the image upload to finish.';
      return;
    }
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

    const now = new Date().toISOString();
    this.form.updated_at = this.toDateTimeLocal(now);

    const product: CreateProductInput = {
      ...this.form,
      updated_at: now,
      sale_price: this.form.sale_price,
      stock: this.form.stock ?? 0,
      rating: this.form.rating,
      review_count: this.form.review_count ?? 0,
      price: this.form.price ?? 0,
      is_active: this.form.is_active,
      attributes,
      extra_image_urls: extraImageUrls
    };

    this.submitting = true;
    this.changeDetector.detectChanges();
    try {
      if (this.editingId) {
        await this.productService.updateProduct(this.editingId, product);
        this.successMessage = 'Product updated successfully.';
      } else {
        await this.productService.createProduct(product);
        this.successMessage = 'Product created successfully.';
        this.form = this.createInitialForm();
        formElement.resetForm(this.form);
      }
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : (this.editingId ? 'Unable to update product.' : 'Unable to create product.');
    } finally {
      this.submitting = false;
      this.changeDetector.detectChanges();
    }
  }

  async uploadImage(event: Event, field: 'main' | 'extra1' | 'extra2'): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.successMessage = '';
    this.errorMessage = '';
    this.uploadingImage = field;
    this.changeDetector.detectChanges();
    try {
      const image = await this.productService.uploadImage(file);
      if (field === 'main') this.form.main_image_url = image.url;
      if (field === 'extra1') this.form.extra_image_url1 = image.url;
      if (field === 'extra2') this.form.extra_image_url2 = image.url;
      this.successMessage = 'Image uploaded successfully.';
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to upload image.';
    } finally {
      this.uploadingImage = null;
      input.value = '';
      this.changeDetector.detectChanges();
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
      is_featured: false, is_new: false, is_active: true, created_at: now, updated_at: now, name: '', price: null,
      category: 'Women', fabric: '', color: '', description: '', tone: 'default', main_image_url: '',
      extra_image_urls: '[]', extra_image_url1: '', extra_image_url2: ''
    };
  }

  private toDateTimeLocal(value?: string): string {
    return value ? new Date(value).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);
  }
}
