import { Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Account, Role } from '../api.models';
import { MarketplaceApiService } from '../marketplace-api.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'nm-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-page.component.html',
  encapsulation: ViewEncapsulation.None
})
export class AuthPageComponent {
  @Output() authenticated = new EventEmitter<{ account: Account; credentials: string }>();

  authMode: AuthMode = 'login';
  busy = false;
  error = '';
  authForm = { name: '', email: '', password: '', role: 'CUSTOMER' as Role, latitude: '', longitude: '' };

  constructor(private readonly api: MarketplaceApiService) {}

  submitAuth(): void {
    this.error = '';
    this.busy = true;
    const email = this.authForm.email.trim();
    const password = this.authForm.password;
    const request = this.authMode === 'login'
      ? this.api.login(email, password)
      : this.api.register({
          name: this.authForm.name.trim(),
          email,
          password,
          role: this.authForm.role,
          ...(this.authForm.latitude !== '' && this.authForm.longitude !== ''
            ? { latitude: Number(this.authForm.latitude), longitude: Number(this.authForm.longitude) }
            : {})
        });

    request.subscribe({
      next: account => {
        const credentials = btoa(`${email}:${password}`);
        const hasLocation = this.authForm.latitude !== '' && this.authForm.longitude !== '';
        if (this.authMode === 'login' && hasLocation) {
          sessionStorage.setItem('near-market-credentials', credentials);
          this.api.updateLocation(Number(this.authForm.latitude), Number(this.authForm.longitude)).subscribe({
            next: updatedAccount => this.completeAuth(updatedAccount, credentials),
            error: () => this.completeAuth(account, credentials)
          });
          return;
        }
        this.completeAuth(account, credentials);
      },
      error: error => this.fail(error)
    });
  }

  useCurrentLocation(): void {
    this.error = '';
    if (!navigator.geolocation) {
      this.error = 'Location access is not available in this browser.';
      return;
    }

    this.busy = true;
    navigator.geolocation.getCurrentPosition(
      position => {
        this.authForm.latitude = position.coords.latitude.toFixed(6);
        this.authForm.longitude = position.coords.longitude.toFixed(6);
        this.busy = false;
      },
      error => {
        this.error = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Allow access in your browser settings or enter coordinates manually.'
          : error.code === error.POSITION_UNAVAILABLE
            ? 'Your current location could not be determined. Please enter coordinates manually.'
            : 'Location lookup timed out. Please try again or enter coordinates manually.';
        this.busy = false;
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  clearError(): void {
    this.error = '';
  }

  private completeAuth(account: Account, credentials: string): void {
    this.authenticated.emit({ account, credentials });
    this.authForm.password = '';
    this.busy = false;
  }

  private fail(error: unknown): void {
    const response = error as HttpErrorResponse;
    const message = response.error?.message ?? response.error?.detail ?? response.error?.error;
    this.error = typeof message === 'string' ? message : response.status === 0
      ? 'Could not connect to the API. Check your connection and ensure the API allows requests from this site.'
      : `Request failed (${response.status}). Please check your details and try again.`;
    this.busy = false;
  }
}