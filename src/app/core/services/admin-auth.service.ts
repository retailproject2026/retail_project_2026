import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = signal<boolean>(false);
  readonly isInitialized = signal<boolean>(false);

  private readonly sessionReadyPromise: Promise<void>;

  constructor(private readonly router: Router) {
    this.sessionReadyPromise = this.initSession();

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);
      this.isAuthenticated.set(!!session?.user);
      this.isInitialized.set(true);
    });
  }

  private async initSession(): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      this.currentUser.set(session?.user ?? null);
      this.isAuthenticated.set(!!session?.user);
    } catch {
      this.currentUser.set(null);
      this.isAuthenticated.set(false);
    } finally {
      this.isInitialized.set(true);
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      this.currentUser.set(data.user);
      this.isAuthenticated.set(true);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred during login.'
      };
    }
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: email.trim(),
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        this.currentUser.set(data.user);
        this.isAuthenticated.set(true);
        return { success: true, message: 'Admin account created successfully.' };
      }

      return {
        success: true,
        message: 'Admin account registered. Please check your email if confirmation is required.'
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred during registration.'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.supabase.auth.signOut();
    } catch {
      // Ignore signOut errors
    } finally {
      this.currentUser.set(null);
      this.isAuthenticated.set(false);
      void this.router.navigate(['/admin/login']);
    }
  }

  async requireAuthentication(): Promise<boolean> {
    if (!this.isInitialized()) {
      await this.sessionReadyPromise;
    }

    if (this.isAuthenticated()) {
      return true;
    }

    void this.router.navigate(['/admin/login']);
    return false;
  }
}
