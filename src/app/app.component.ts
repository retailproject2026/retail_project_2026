import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (loading.isLoading()) {
      <div class="global-loader" role="status" aria-live="polite" aria-label="Loading">
        <span class="global-loader-spinner" aria-hidden="true"></span>
      </div>
    }
    <router-outlet />
  `
})
export class AppComponent {
  constructor(readonly loading: LoadingService) {}
}
