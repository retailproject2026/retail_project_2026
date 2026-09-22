import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        title: 'Home | Retail Store',
        loadComponent: () =>
          import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'products',
        title: 'Products | Retail Store',
        loadComponent: () =>
          import('./features/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'admin/newproduct',
        canActivate: [adminGuard],
        title: 'Add Product | Retail Store',
        loadComponent: () =>
          import('./features/admin/newproduct/product-create.component').then(m => m.ProductCreateComponent)
      },
      {
        path: 'products/:id',
        title: 'Product Details | Retail Store',
        loadComponent: () =>
          import('./features/product-details/product-details.component').then(m => m.ProductDetailsComponent)
      },
      {
        path: 'cart',
        title: 'Cart | Retail Store',
        loadComponent: () =>
          import('./features/cart/cart.component').then(m => m.CartComponent)
      },
      {
        path: 'checkout',
        title: 'Checkout | Retail Store',
        loadComponent: () =>
          import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
      },
      {
        path: 'orders',
        title: 'Track Order | Retail Store',
        loadComponent: () =>
          import('./features/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'admin/orders',
        canActivate: [adminGuard],
        title: 'Admin Orders | Retail Store',
        loadComponent: () =>
          import('./features/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent)
      }
      ,{
        path: 'admin/login',
        title: 'Admin Login | Retail Store',
        loadComponent: () =>
          import('./features/admin/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
      }
    ]
  },
  {
    path: '**',
    title: 'Page Not Found | Retail Store',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
