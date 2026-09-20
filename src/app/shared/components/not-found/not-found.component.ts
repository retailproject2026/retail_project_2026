import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <div class="page-container not-found">
      <h1>404</h1>
      <p>The page you requested was not found.</p>
      <a mat-flat-button color="primary" routerLink="/">Go Home</a>
    </div>
  `,
  styles: [`
    .not-found { text-align: center; padding: 80px 16px; }
    h1 { font-size: 72px; margin: 0; }
  `]
})
export class NotFoundComponent {}
