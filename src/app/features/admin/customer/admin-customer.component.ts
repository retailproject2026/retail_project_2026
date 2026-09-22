import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ContactInput, ContactRecord, ContactService } from '../../../core/services/contact.service';

@Component({
  selector: 'app-admin-customer',
  standalone: true,
  imports: [DatePipe, FormsModule, MatButtonModule, RouterLink],
  templateUrl: './admin-customer.component.html',
  styleUrl: './admin-customer.component.scss'
})
export class AdminCustomerComponent implements OnInit {
  private readonly contactsService = inject(ContactService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  contacts: ContactRecord[] = [];
  form: ContactInput = this.emptyContact();
  editingId: string | null = null;
  loading = true;
  saving = false;
  deletingId = '';
  errorMessage = '';
  successMessage = '';
  newOnly = false;
  editOnly = false;

  async ngOnInit(): Promise<void> {
    const routePath = this.route.snapshot.routeConfig?.path;
    this.newOnly = routePath === 'admin/customers/new';
    this.editOnly = routePath === 'admin/customers/edit/:id';
    if (this.editOnly) {
      this.editingId = this.route.snapshot.paramMap.get('id');
    }
    await this.loadContacts();
    if (this.editingId) await this.loadCustomerForEdit(this.editingId);
  }

  async loadContacts(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    try {
      this.contacts = await this.contactsService.findAll();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load contacts.';
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }

  edit(contact: ContactRecord): void {
    void this.router.navigate(['/admin/customers/edit', contact.id]);
  }

  cancelEdit(form: NgForm): void {
    this.editingId = null;
    this.form = this.emptyContact();
    form.resetForm(this.form);
  }

  async save(form: NgForm): Promise<void> {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      if (this.editingId) {
        await this.contactsService.update(this.editingId, this.form);
        this.successMessage = 'Customer updated successfully.';
      } else {
        await this.contactsService.create(this.form);
        this.successMessage = 'Customer added successfully.';
      }
      this.editingId = null;
      this.form = this.emptyContact();
      form.resetForm(this.form);
      if (this.newOnly || this.editOnly) {
        await this.router.navigate(['/admin/customer']);
        return;
      }
      await this.loadContacts();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to save customer.';
    } finally {
      this.saving = false;
      this.changeDetector.markForCheck();
    }
  }

  async remove(contact: ContactRecord): Promise<void> {
    const displayName = `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || contact.mobile_number;
    if (!confirm(`Deactivate ${displayName}?`)) return;
    this.deletingId = contact.id;
    this.errorMessage = '';
    try {
      await this.contactsService.remove(contact.id);
      this.contacts = this.contacts.filter(current => current.id !== contact.id);
      this.successMessage = 'Customer deactivated successfully.';
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to deactivate customer.';
    } finally {
      this.deletingId = '';
      this.changeDetector.markForCheck();
    }
  }

  private emptyContact(): ContactInput {
    const now = this.toDateTimeLocal(new Date().toISOString());
    return {
      first_name: '', last_name: '', email: '', mobile_number: '', created_at: now, updated_at: now, is_active: true,
      address_id: null, address_type: 'Home', address_line1: '', address_line2: '', city: '', state: '', country: 'India',
      pin_code: '', is_default: true, address_created_at: now, address_updated_at: now
    };
  }

  private async loadCustomerForEdit(id: string): Promise<void> {
    const customer = this.contacts.find(current => current.id === id);
    if (customer) {
      this.setFormFromCustomer(customer);
      return;
    }
    this.errorMessage = 'Customer not found.';
  }

  private setFormFromCustomer(contact: ContactRecord): void {
    this.form = {
      first_name: contact.first_name ?? '', last_name: contact.last_name ?? '', email: contact.email ?? '', mobile_number: contact.mobile_number,
      created_at: this.toDateTimeLocal(contact.created_at), updated_at: this.toDateTimeLocal(contact.updated_at), is_active: contact.is_active,
      address_id: contact.address_id, address_type: contact.address_type, address_line1: contact.address_line1,
      address_line2: contact.address_line2 ?? '', city: contact.city, state: contact.state, country: contact.country,
      pin_code: contact.pin_code, is_default: contact.is_default,
      address_created_at: this.toDateTimeLocal(contact.address_created_at ?? undefined),
      address_updated_at: this.toDateTimeLocal(contact.address_updated_at ?? undefined)
    };
  }

  private toDateTimeLocal(value?: string): string {
    return value ? new Date(value).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);
  }
}
