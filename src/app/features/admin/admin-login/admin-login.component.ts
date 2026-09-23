import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
export class AdminLoginComponent implements OnInit {
  private readonly adminAuth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  mode: 'signin' | 'signup' = 'signin';
  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';
  submitting = false;

  async ngOnInit(): Promise<void> {
    if (this.adminAuth.isAuthenticated()) {
      await this.router.navigate(['/admin/orders']);
    }
  }

  switchMode(mode: 'signin' | 'signup'): void {
    this.mode = mode;
    this.errorMessage = '';
    this.successMessage = '';
    this.changeDetector.markForCheck();
  }

  async submit(): Promise<void> {
    const trimmedEmail = this.email.trim();
    if (!trimmedEmail || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.submitting = true;

    try {
      if (this.mode === 'signin') {
        const result = await this.adminAuth.login(trimmedEmail, this.password);
        if (result.success) {
          await this.router.navigate(['/admin/orders']);
          return;
        }
        this.errorMessage = result.error ?? 'Invalid email or password.';
      } else {
        const result = await this.adminAuth.signUp(trimmedEmail, this.password);
        if (result.success) {
          if (this.adminAuth.isAuthenticated()) {
            await this.router.navigate(['/admin/orders']);
            return;
          }
          this.successMessage = result.message ?? 'Registration successful.';
          this.mode = 'signin';
        } else {
          this.errorMessage = result.error ?? 'Failed to register account.';
        }
      }
    } catch (err) {
      this.errorMessage = err instanceof Error ? err.message : 'Authentication failed.';
    } finally {
      this.submitting = false;
      this.changeDetector.markForCheck();
    }
  }
}
