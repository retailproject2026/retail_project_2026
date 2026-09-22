import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CustomerAddressService } from '../../../core/services/customer-address.service';

export interface DeliveryAddress {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  mobileNumber: string;
}

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [FormsModule, MatButtonModule],
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.scss'
})
export class AddressFormComponent {
  @Input({ required: true }) address!: DeliveryAddress;
  @Input() loading = false;
  @Output() submitted = new EventEmitter<void>();
  lookupLoading = false;
  saveLoading = false;
  addressMessage = '';

  constructor(private readonly customerAddress: CustomerAddressService) {}

  async lookupAddress(): Promise<void> {
    const mobileNumber = this.address.mobileNumber.trim();
    if (!/^[0-9]{10}$/.test(mobileNumber)) return;

    this.lookupLoading = true;
    this.addressMessage = '';
    try {
      const savedAddress = await this.customerAddress.findByMobile(mobileNumber);
      if (savedAddress) {
        Object.assign(this.address, savedAddress);
        this.addressMessage = 'Saved address loaded.';
      }
    } catch {
      this.addressMessage = 'Unable to look up the saved address.';
    } finally {
      this.lookupLoading = false;
    }
  }

  async submitAddress(): Promise<void> {
    this.saveLoading = true;
    this.addressMessage = '';
    try {
      await this.customerAddress.save(this.address);
      this.submitted.emit();
    } catch {
      this.addressMessage = 'Unable to save the delivery address. Please try again.';
    } finally {
      this.saveLoading = false;
    }
  }
}
