import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Account } from './api.models';
import { AuthPageComponent } from './components/auth-page.component';
import { CustomerDashboardComponent } from './components/customer-dashboard.component';
import { SupplierDashboardComponent } from './components/supplier-dashboard.component';

@Component({
  selector: 'nm-root',
  standalone: true,
  imports: [AuthPageComponent, CustomerDashboardComponent, SupplierDashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  account: Account | null = null;

  ngOnInit(): void {
    const rawAccount = sessionStorage.getItem('near-market-account');
    if (!rawAccount || !sessionStorage.getItem('near-market-credentials')) return;

    try {
      this.account = JSON.parse(rawAccount) as Account;
    } catch {
      this.logout();
    }
  }

  authenticate(session: { account: Account; credentials: string }): void {
    this.account = session.account;
    sessionStorage.setItem('near-market-account', JSON.stringify(session.account));
    sessionStorage.setItem('near-market-credentials', session.credentials);
  }

  logout(): void {
    sessionStorage.removeItem('near-market-account');
    sessionStorage.removeItem('near-market-credentials');
    this.account = null;
  }
}