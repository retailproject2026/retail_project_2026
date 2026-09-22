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

export interface ProductPage {
  products: Product[];
  hasMore: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  private readonly apiUrl = environment.apiUrl;
  constructor(
    private readonly http: HttpClient,
    private readonly loading: LoadingService
  ) {}

  async getProductList(): Promise<Product[]> {
    return this.loading.track((async () => {
      const { data, error } = await this.supabase
        .from('products')
        .select('id,name,price,sale_price,currency,product_type,category,description,stock,inStock,tone,main_image_url,fabric,is_new,is_featured');
      if (error) throw error;

      return Promise.all(((data ?? []) as DatabaseProduct[]).map(product => this.normalizeProduct(product)));
    })());
  }

  async getProductListPage(page: number, pageSize: number): Promise<ProductPage> {
    return this.loading.track((async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await this.supabase
        .from('products')
        .select('id,name,price,sale_price,currency,product_type,category,description,stock,inStock,tone,main_image_url,fabric,is_new,is_featured', { count: 'exact' })
        .range(from, to);
      if (error) throw error;

      const products = await Promise.all(((data ?? []) as DatabaseProduct[]).map(product => this.normalizeProduct(product)));
      return { products, hasMore: from + products.length < (count ?? 0) };
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

  private async normalizeProduct(product: DatabaseProduct, includeGallery = false): Promise<Product> {
    const mainImageUrl = product.main_image_url ?? '';
    const extraImageUrl1 = includeGallery ? product.extra_image_url1 ?? '' : '';
    const extraImageUrl2 = includeGallery ? product.extra_image_url2 ?? '' : '';

    return {
      ...product,
      salePrice: product.sale_price,
      productType: product.product_type ?? (product.category === 'Accessories' ? 'Accessories' : 'Clothes'),
      reviewCount: product.review_count,
      isFeatured: product.is_featured ?? false,
      isNew: product.is_new ?? false,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      mainImageUrl: mainImageUrl,
      extraImageUrls: includeGallery ? product.extra_image_urls ?? [] : [],
      extraImageUrl1: extraImageUrl1,
      extraImageUrl2: extraImageUrl2,
      currency: product.currency ?? 'INR',
      inStock: product.inStock ?? product.in_stock ?? ((product.stock ?? 1) > 0),
      stock: product.stock ?? 0,
      tone: product.tone ?? 'default'
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