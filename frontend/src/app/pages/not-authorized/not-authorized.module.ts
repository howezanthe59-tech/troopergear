import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NotAuthorizedComponent } from './not-authorized.component';

const routes: Routes = [
  { path: '', component: NotAuthorizedComponent }
];

@NgModule({
  declarations: [NotAuthorizedComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class NotAuthorizedModule {}
