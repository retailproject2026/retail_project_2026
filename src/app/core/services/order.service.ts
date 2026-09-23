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

  async findByMobileNumber(mobileNumber: string): Promise<OrderRecord[]> {
    const raw = mobileNumber.trim();
    if (!raw) return [];

    const digitsOnly = raw.replace(/\D/g, '');
    const mobileCandidates = Array.from(new Set([
      raw,
      digitsOnly,
      digitsOnly.length === 10 ? `+91${digitsOnly}` : '',
      digitsOnly.length === 12 && digitsOnly.startsWith('91') ? digitsOnly.slice(2) : '',
      digitsOnly.length === 12 && digitsOnly.startsWith('91') ? `+${digitsOnly}` : ''
    ])).filter(Boolean);

    const ordersMap = new Map<string, any>();

    // 1. Find customer IDs associated with this mobile number
    try {
      const { data: customers, error: customerError } = await this.supabase
        .from('customers')
        .select('id')
        .in('mobile_number', mobileCandidates);

      if (!customerError && customers?.length) {
        const customerIds = customers.map(c => c.id);
        const { data: ordersByCustomer, error: ordersByCustomerError } = await this.supabase
          .from('orders')
          .select('id,order_number,status,subtotal,delivery_charge,discount_amount,total_amount,payment_status,payment_method,shipping_address,created_at,updated_at')
          .in('customer_id', customerIds)
          .order('created_at', { ascending: false });

        if (!ordersByCustomerError && ordersByCustomer) {
          for (const order of ordersByCustomer) {
            ordersMap.set(order.id, order);
          }
        }
      }
    } catch {
      // Continue to address search fallback
    }

    // 2. Supplementary search: match shipping_address JSON mobile_number
    try {
      for (const candidate of mobileCandidates) {
        const { data: ordersByAddress, error: ordersByAddressError } = await this.supabase
          .from('orders')
          .select('id,order_number,status,subtotal,delivery_charge,discount_amount,total_amount,payment_status,payment_method,shipping_address,created_at,updated_at')
          .filter('shipping_address->>mobile_number', 'eq', candidate)
          .order('created_at', { ascending: false });

        if (!ordersByAddressError && ordersByAddress) {
          for (const order of ordersByAddress) {
            ordersMap.set(order.id, order);
          }
        }
      }
    } catch {
      // Ignore if JSON filter syntax is not supported in the environment
    }

    const orders = Array.from(ordersMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (!orders.length) return [];

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

  async createPendingOrder(address: DeliveryAddress, items: CartItem[]): Promise<{ orderId: string; orderNumber: string }> {
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
        status: 'Pending',
        subtotal,
        total_amount: subtotal,
        payment_status: 'Pending',
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

    return { orderId: order.id, orderNumber };
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: 'Paid' | 'Failed',
    orderStatus?: OrderStatus,
    paymentId?: string
  ): Promise<void> {
    const updatePayload: Record<string, unknown> = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };
    if (orderStatus) {
      updatePayload['status'] = orderStatus;
    }
    if (paymentId) {
      updatePayload['payment_method'] = 'Razorpay';
    }

    const { error } = await this.supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);
    if (error) throw error;
  }

  async createPaidOrder(address: DeliveryAddress, items: CartItem[], payment: OrderPayment): Promise<string> {
    const { orderId, orderNumber } = await this.createPendingOrder(address, items);
    await this.updatePaymentStatus(orderId, 'Paid', 'Confirmed', payment.razorpay_payment_id);
    return orderNumber;
  }
}