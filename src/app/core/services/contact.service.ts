import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface ContactRecord {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile_number: string;
  address_id: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  address_type: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  is_default: boolean;
  address_created_at: string | null;
  address_updated_at: string | null;
}

export interface ContactInput {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  address_id: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  address_type: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  is_default: boolean;
  address_created_at: string;
  address_updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

  async findAll(): Promise<ContactRecord[]> {
    const { data: customers, error } = await this.supabase
      .from('customers')
      .select('id,first_name,last_name,email,mobile_number,created_at,updated_at,is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!customers?.length) return [];

    const { data: addresses, error: addressError } = await this.supabase
      .from('customer_addresses')
      .select('id,customer_id,address_type,address_line1,address_line2,city,state,country,pin_code,is_default,created_at,updated_at')
      .in('customer_id', customers.map(customer => customer.id))
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (addressError) throw addressError;

    const latestAddress = new Map<string, Record<string, unknown>>();
    for (const address of addresses ?? []) {
      if (!latestAddress.has(address.customer_id)) latestAddress.set(address.customer_id, address);
    }

    return customers.map(customer => {
      const address = latestAddress.get(customer.id);
      return {
        ...customer,
        address_id: (address?.['id'] as string | undefined) ?? null,
        address_type: (address?.['address_type'] as string | undefined) ?? 'Home',
        address_line1: (address?.['address_line1'] as string | undefined) ?? '',
        address_line2: (address?.['address_line2'] as string | undefined) ?? null,
        city: (address?.['city'] as string | undefined) ?? '',
        state: (address?.['state'] as string | undefined) ?? '',
        country: (address?.['country'] as string | undefined) ?? 'India',
        pin_code: (address?.['pin_code'] as string | undefined) ?? '',
        is_default: (address?.['is_default'] as boolean | undefined) ?? true,
        address_created_at: (address?.['created_at'] as string | undefined) ?? null,
        address_updated_at: (address?.['updated_at'] as string | undefined) ?? null
      };
    }) as ContactRecord[];
  }

  async create(contact: ContactInput): Promise<void> {
    const { data: customer, error: customerError } = await this.supabase.from('customers').insert({
      mobile_number: contact.mobile_number,
      email: contact.email,
      first_name: contact.first_name,
      last_name: contact.last_name,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
      is_active: contact.is_active
    }).select('id').single();
    if (customerError) throw customerError;
    const { error: addressError } = await this.supabase.from('customer_addresses').insert(this.addressPayload(customer.id, contact));
    if (addressError) throw addressError;
  }

  async update(id: string, contact: ContactInput): Promise<void> {
    const { error: customerError } = await this.supabase.from('customers').update({
      mobile_number: contact.mobile_number,
      email: contact.email,
      first_name: contact.first_name,
      last_name: contact.last_name,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
      is_active: contact.is_active
    }).eq('id', id);
    if (customerError) throw customerError;

    const addressPayload = this.addressPayload(id, contact);
    const addressRequest = contact.address_id
      ? this.supabase.from('customer_addresses').update(addressPayload).eq('id', contact.address_id)
      : this.supabase.from('customer_addresses').insert(addressPayload);
    const { error: addressError } = await addressRequest;
    if (addressError) throw addressError;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('customers').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  }

  private addressPayload(customerId: string, contact: ContactInput): Record<string, string | boolean> {
    return {
      customer_id: customerId,
      address_type: contact.address_type,
      address_line1: contact.address_line1,
      address_line2: contact.address_line2,
      city: contact.city,
      state: contact.state,
      country: contact.country,
      pin_code: contact.pin_code,
      is_default: contact.is_default,
      created_at: contact.address_created_at,
      updated_at: contact.address_updated_at
    };
  }
}
