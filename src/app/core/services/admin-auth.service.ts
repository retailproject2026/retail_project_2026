import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly storageKey = 'retail-admin-authenticated';
  readonly isAuthenticated = signal(this.readState());

  constructor(private readonly router: Router) {}

  login(password: string): boolean {
    const valid = password === environment.adminPassword;
    if (valid) {
      sessionStorage.setItem(this.storageKey, 'true');
      this.isAuthenticated.set(true);
    }
    return valid;
  }

  logout(): void {
    sessionStorage.removeItem(this.storageKey);
    this.isAuthenticated.set(false);
    void this.router.navigate(['/']);
  }

  requireAuthentication(): boolean {
    if (this.isAuthenticated()) return true;
    void this.router.navigate(['/admin/login']);
    return false;
  }

  private readState(): boolean {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(this.storageKey) === 'true';
  }
}
