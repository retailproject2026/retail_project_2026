import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { LoadingService } from './loading.service';
import type { DeliveryAddress } from '../../shared/components/address-form/address-form.component';

@Injectable({ providedIn: 'root' })
export class CustomerAddressService {
  private readonly supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

  constructor(private readonly loading: LoadingService) {}

  findByMobile(mobileNumber: string): Promise<DeliveryAddress | null> {
    return this.loading.track((async () => {
    const { data: customer, error: customerError } = await this.supabase
      .from('customers')
      .select('id')
      .eq('mobile_number', mobileNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (customerError) throw customerError;
    if (!customer) return null;

    const { data: savedAddress, error: addressError } = await this.supabase
      .from('customer_addresses')
      .select('address_line1,city,state,pin_code')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (addressError) throw addressError;
    if (!savedAddress) return null;

    return {
      mobileNumber,
      address: savedAddress.address_line1 ?? '',
      city: savedAddress.city ?? '',
      state: savedAddress.state ?? '',
      postalCode: savedAddress.pin_code ?? ''
    };
    })());
  }

  save(address: DeliveryAddress): Promise<string> {
    return this.loading.track((async () => {
    const { data: existingCustomer, error: lookupError } = await this.supabase
      .from('customers')
      .select('id')
      .eq('mobile_number', address.mobileNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupError) throw lookupError;

    let customerId = existingCustomer?.id;
    if (!customerId) {
      const { data: newCustomer, error: customerError } = await this.supabase
        .from('customers')
        .insert({ mobile_number: address.mobileNumber })
        .select('id')
        .single();
      if (customerError) throw customerError;
      customerId = newCustomer.id;
    }

    const { data: existingAddress, error: existingAddressError } = await this.supabase
      .from('customer_addresses')
      .select('id')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingAddressError) throw existingAddressError;

    const addressData = {
      customer_id: customerId,
      address_type: 'Home',
      address_line1: address.address,
      city: address.city,
      state: address.state,
      country: 'India',
      pin_code: address.postalCode,
      updated_at: new Date().toISOString()
    };
    const addressRequest = existingAddress
      ? this.supabase.from('customer_addresses').update(addressData).eq('id', existingAddress.id)
      : this.supabase.from('customer_addresses').insert(addressData);
    const { error: addressError } = await addressRequest;
    if (addressError) throw addressError;
    return customerId;
    })());
  }
}
