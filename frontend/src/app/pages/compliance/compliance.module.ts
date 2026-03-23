import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PrivacyComponent } from '../privacy/privacy.component';
import { ReturnsComponent } from '../returns/returns.component';
import { TermsComponent } from '../terms/terms.component';

const routes: Routes = [
  {
    path: 'privacy',
    component: PrivacyComponent,
    data: {
      title: 'Privacy Policy',
      description: "Read TrooperGear's privacy policy and learn how we collect and use personal data."
    }
  },
  {
    path: 'terms',
    component: TermsComponent,
    data: {
      title: 'Terms & Conditions',
      description: 'Review the terms and conditions for using TrooperGear services and purchasing products.'
    }
  },
  {
    path: 'returns',
    component: ReturnsComponent,
    data: {
      title: 'Return / Refund Policy',
      description: 'Learn about returns, exchanges, and refunds for TrooperGear orders.'
    }
  }
];

@NgModule({
  declarations: [
    PrivacyComponent,
    ReturnsComponent,
    TermsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class ComplianceModule { }
