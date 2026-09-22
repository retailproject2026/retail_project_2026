import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

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

  submitAddress(): void {
    this.submitted.emit();
  }
}
