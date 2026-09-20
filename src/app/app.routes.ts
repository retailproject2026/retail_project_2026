import { Routes } from '@angular/router';

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
