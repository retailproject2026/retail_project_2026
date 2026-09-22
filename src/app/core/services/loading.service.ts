import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly isLoading = signal(false);
  private activeRequests = 0;

  start(): void {
    this.activeRequests += 1;
    this.isLoading.set(true);
  }

  stop(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.isLoading.set(this.activeRequests > 0);
  }

  track<T>(operation: Promise<T>): Promise<T> {
    this.start();

    return operation.finally(() => {
      this.stop();
    });
  }
}