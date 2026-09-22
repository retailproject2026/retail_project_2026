import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { DeliveryAddress } from '../../shared/components/address-form/address-form.component';
import { CustomerAddressService } from './customer-address.service';
import { CartItem } from './cart.service';
import { productDatabaseId } from './product-identity';

interface OrderPayment {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderItemRecord {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  delivery_charge: number;
  discount_amount: number;
  total_amount: number;
  payment_status: string;
  payment_method: string | null;
  shipping_address: Record<string, string>;
  created_at: string;
  updated_at: string;
  items: OrderItemRecord[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

  constructor(private readonly customerAddress: CustomerAddressService) {}

  async findByOrderNumber(orderNumber: string): Promise<OrderRecord | null> {
    const searchValue = orderNumber.trim();
    const { data: orderByNumber, error: orderNumberError } = await this.supabase
      .from('orders')
      .select('id,order_number,status,subtotal,delivery_charge,discount_amount,total_amount,payment_status,payment_method,shipping_address,created_at,updated_at')
      .eq('order_number', searchValue)
      .maybeSingle();
    if (orderNumberError) throw orderNumberError;

    let order = orderByNumber;
    if (!order) {
      const { data: orderById, error: orderIdError } = await this.supabase
        .from('orders')
        .select('id,order_number,status,subtotal,delivery_charge,discount_amount,total_amount,payment_status,payment_method,shipping_address,created_at,updated_at')
        .eq('id', searchValue)
        .maybeSingle();
      if (orderIdError) throw orderIdError;
      order = orderById;
    }
    if (!order) return null;

    const { data: items, error: itemsError } = await this.supabase
      .from('order_items')
      .select('id,product_name,quantity,unit_price,total_price')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });
    if (itemsError) throw itemsError;

    return { ...order, items: items ?? [] } as OrderRecord;
  }

  async findAll(): Promise<OrderRecord[]> {
    const { data: orders, error: ordersError } = await this.supabase
      .from('orders')
      .select('id,order_number,status,subtotal,delivery_charge,discount_amount,total_amount,payment_status,payment_method,shipping_address,created_at,updated_at')
      .order('created_at', { ascending: false });
    if (ordersError) throw ordersError;
    if (!orders?.length) return [];

    const orderIds = orders.map(order => order.id);
    const { data: items, error: itemsError } = await this.supabase
      .from('order_items')
      .select('id,order_id,product_name,quantity,unit_price,total_price')
      .in('order_id', orderIds)
      .order('created_at', { ascending: true });
    if (itemsError) throw itemsError;

    const itemsByOrder = new Map<string, OrderItemRecord[]>();
    for (const item of items ?? []) {
      const orderItems = itemsByOrder.get(item.order_id) ?? [];
      orderItems.push(item as OrderItemRecord);
      itemsByOrder.set(item.order_id, orderItems);
    }
    return orders.map(order => ({
      ...order,
      items: itemsByOrder.get(order.id) ?? []
    })) as OrderRecord[];
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    const { error } = await this.supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) throw error;
  }

  async createPaidOrder(address: DeliveryAddress, items: CartItem[], payment: OrderPayment): Promise<string> {
    const customerId = await this.customerAddress.save(address);
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const shippingAddress = {
      mobile_number: address.mobileNumber,
      address_line1: address.address,
      city: address.city,
      state: address.state,
      country: 'India',
      pin_code: address.postalCode
    };

    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        status: 'Confirmed',
        subtotal,
        total_amount: subtotal,
        payment_status: 'Paid',
        payment_method: 'Razorpay',
        shipping_address: shippingAddress
      })
      .select('id')
      .single();
    if (orderError) throw orderError;

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: productDatabaseId(item.id),
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    }));
    const { error: itemsError } = await this.supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    return orderNumber;
  }
}