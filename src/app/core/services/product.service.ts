import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoadingService } from './loading.service';

export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  salePrice?: number | null;
  currency?: string;
  productType: string;
  category: string;
  brand?: string;
  fabric?: string;
  color?: string;
  description: string;
  stock?: number;
  inStock?: boolean;
  attributes?: Record<string, string | string[]>;
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  createdAt?: string;
  updatedAt?: string;
  tone: string;
  mainImageUrl: string;
  extraImageUrls: string[];
  extraImageUrl1: string;
  extraImageUrl2: string;
  isActive?: boolean;
}

interface DatabaseProduct {
  id: string;
  name: string;
  sku?: string;
  price: number;
  sale_price?: number | null;
  currency?: string;
  product_type?: string;
  category: string;
  brand?: string;
  fabric?: string;
  color?: string;
  description: string;
  stock?: number;
  inStock?: boolean;
  in_stock?: boolean;
  attributes?: Record<string, string | string[]>;
  rating?: number;
  review_count?: number;
  is_featured?: boolean;
  is_new?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  tone?: string;
  main_image_url?: string;
  extra_image_urls?: string[];
  extra_image_url1?: string;
  extra_image_url2?: string;
}

interface CloudinaryImageResponse {
  success: boolean;
  publicId: string;
  url: string;
}

export interface CloudinaryUploadImage {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

interface CloudinaryUploadResponse {
  success?: boolean;
  image?: CloudinaryUploadImage;
  publicId?: string;
  url?: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface ProductPage {
  products: Product[];
  hasMore: boolean;
}

export interface CreateProductInput {
  id: string;
  sku: string;
  sale_price: number | null;
  currency: string;
  product_type: string;
  brand: string;
  stock: number;
  inStock: boolean;
  attributes: Record<string, string | string[]>;
  rating: number | null;
  review_count: number;
  is_featured: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
  name: string;
  price: number;
  category: string;
  fabric: string;
  color: string;
  description: string;
  tone: string;
  main_image_url: string;
  extra_image_urls: string[];
  extra_image_url1: string;
  extra_image_url2: string;
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  private readonly apiUrl = environment.apiUrl;
  constructor(
    private readonly http: HttpClient,
    private readonly loading: LoadingService
  ) {}

  async getProductList(options?: { activeOnly?: boolean }): Promise<Product[]> {
    return this.loading.track((async () => {
      let query = this.supabase
        .from('products')
        .select('id,name,price,sale_price,currency,product_type,category,description,stock,inStock,tone,main_image_url,fabric,is_new,is_featured,is_active');
      
      if (options?.activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return Promise.all(((data ?? []) as DatabaseProduct[]).map(product => this.normalizeProduct(product)));
    })());
  }

  async getProductListPage(page: number, pageSize: number, options?: { activeOnly?: boolean }): Promise<ProductPage> {
    return this.loading.track((async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      let query = this.supabase
        .from('products')
        .select('id,name,price,sale_price,currency,product_type,category,description,stock,inStock,tone,main_image_url,fabric,is_new,is_featured,is_active', { count: 'exact' });

      if (options?.activeOnly !== false) {
        query = query.eq('is_active', true);
      }

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      const products = await Promise.all(((data ?? []) as DatabaseProduct[]).map(product => this.normalizeProduct(product)));
      return { products, hasMore: from + products.length < (count ?? 0) };
    })());
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<void> {
    await this.loading.track((async () => {
      const { error } = await this.supabase
        .from('products')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    })());
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.loading.track((async () => {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      return this.normalizeProduct(data as DatabaseProduct, true);
    })());
  }

  async createProduct(product: CreateProductInput): Promise<void> {
    await this.loading.track((async () => {
      const { error } = await this.supabase.from('products').insert(product);
      if (error) throw error;
    })());
  }

  async updateProduct(id: string, product: CreateProductInput): Promise<void> {
    await this.loading.track((async () => {
      const { error } = await this.supabase.from('products').update(product).eq('id', id);
      if (error) throw error;
    })());
  }

  async uploadImage(file: File): Promise<CloudinaryUploadImage> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await firstValueFrom(
      this.http.post<CloudinaryUploadResponse>(`${this.apiUrl}/cloudinary/upload`, formData)
    );
    const image = response.image ?? response;
    if (response.success === false || !image.url) {
      throw new Error('Image upload did not return a valid image URL.');
    }
    return image as CloudinaryUploadImage;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.loading.track((async () => {
      const { error } = await this.supabase.from('products').delete().eq('id', id).select('id');
      if (!error) return;

      if (error.code === '42501') {
        throw new Error('You do not have permission to delete this product.');
      }
      if (error.code === '23503') {
        throw new Error('This product cannot be deleted because it is used by another record.');
      }
      throw new Error(error.message || 'Unable to delete product.');
    })());
  }

  private async normalizeProduct(product: DatabaseProduct, includeGallery = false): Promise<Product> {
    const mainImageUrl = product.main_image_url ?? '';
    const extraImageUrl1 = includeGallery ? product.extra_image_url1 ?? '' : '';
    const extraImageUrl2 = includeGallery ? product.extra_image_url2 ?? '' : '';

    let extraImageUrls: string[] = [];
    if (includeGallery) {
      if (Array.isArray(product.extra_image_urls)) {
        extraImageUrls = product.extra_image_urls.filter((url): url is string => typeof url === 'string' && !!url.trim());
      } else if (typeof product.extra_image_urls === 'string') {
        try {
          const parsed = JSON.parse(product.extra_image_urls);
          if (Array.isArray(parsed)) {
            extraImageUrls = parsed.filter((url): url is string => typeof url === 'string' && !!url.trim());
          }
        } catch {
          if ((product.extra_image_urls as string).trim()) {
            extraImageUrls = [(product.extra_image_urls as string).trim()];
          }
        }
      }

      if (extraImageUrl1 && !extraImageUrls.includes(extraImageUrl1)) {
        extraImageUrls.push(extraImageUrl1);
      }
      if (extraImageUrl2 && !extraImageUrls.includes(extraImageUrl2)) {
        extraImageUrls.push(extraImageUrl2);
      }
    }

    let salePrice: number | null = null;
    if (product.sale_price !== null && product.sale_price !== undefined) {
      const parsedSale = Number(product.sale_price);
      if (Number.isFinite(parsedSale) && parsedSale > 0) {
        salePrice = parsedSale;
      }
    }
    const rawPrice = Number(product.price);
    const price = Number.isFinite(rawPrice) ? rawPrice : 0;

    return {
      ...product,
      price: price,
      salePrice: salePrice,
      productType: product.product_type ?? (product.category === 'Accessories' ? 'Accessories' : 'Clothes'),
      reviewCount: product.review_count,
      isFeatured: product.is_featured ?? false,
      isNew: product.is_new ?? false,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      mainImageUrl: mainImageUrl,
      extraImageUrls: extraImageUrls,
      extraImageUrl1: extraImageUrl1,
      extraImageUrl2: extraImageUrl2,
      currency: product.currency ?? 'INR',
      inStock: product.inStock ?? product.in_stock ?? ((product.stock ?? 1) > 0),
      stock: product.stock ?? 0,
      tone: product.tone ?? 'default',
      isActive: product.is_active ?? true
    };
  }

  private async resolveImageUrl(imageValue: string): Promise<string> {
    if (!imageValue || this.isFullUrl(imageValue)) return imageValue;

    try {
      const params = new HttpParams().set('publicId', imageValue);
      const response = await firstValueFrom(
       
        this.http.get<CloudinaryImageResponse>(`${this.apiUrl}/cloudinary/image`, { params })
      );
      return response.success && response.url ? response.url : imageValue;
    } catch {
      return imageValue;
    }
  }

  private isFullUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }
}