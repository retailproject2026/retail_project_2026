import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AdminAuthService } from '../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent {
  private readonly adminAuth = inject(AdminAuthService);
  private readonly router = inject(Router);
  password = '';
  errorMessage = '';
  submitting = false;

  submit(): void {
    this.errorMessage = '';
    this.submitting = true;
    if (this.adminAuth.login(this.password)) {
      void this.router.navigate(['/admin/orders']);
      return;
    }

    this.errorMessage = 'Invalid admin password.';
    this.password = '';
    this.submitting = false;
  }
}
