import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminGuard: CanActivateFn = () => inject(AdminAuthService).requireAuthentication();
