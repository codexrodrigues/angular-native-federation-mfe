import { Routes } from '@angular/router';
import { InstallmentCreateComponent } from './installment-create.component';
import { InstallmentEditComponent } from './installment-edit.component';
import { LegacyFormComponent } from './legacy-form/legacy-form.component';
import { PayablesComponent } from './payables.component';
import { PaymentAdvanceComponent } from './payment-advance.component';
import { GdeHomeComponent } from './gde.component';

export const GDE_ROUTES: Routes = [
  { path: '', component: GdeHomeComponent },
  { path: 'contas-a-pagar', component: PayablesComponent },
  { path: 'inclusao-parcela-a-pagar', component: InstallmentCreateComponent },
  { path: 'alteracao-parcela-a-pagar', component: InstallmentEditComponent },
  { path: 'adiantamento-de-pagamento', component: PaymentAdvanceComponent },
  { path: 'legacy-form/new', component: LegacyFormComponent },
  { path: 'legacy-form/:id', component: LegacyFormComponent }
];
