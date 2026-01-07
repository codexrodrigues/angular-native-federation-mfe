import { Routes } from '@angular/router';
import { AccountsHomeComponent } from './accounts-home.component';
import { AccountsLimitsComponent } from './accounts-limits.component';
import { AccountsStatementComponent } from './accounts-statement.component';

export const ACCOUNTS_ROUTES: Routes = [
  { path: '', component: AccountsHomeComponent },
  { path: 'extratos', component: AccountsStatementComponent },
  { path: 'limites-e-bloqueios', component: AccountsLimitsComponent }
];
