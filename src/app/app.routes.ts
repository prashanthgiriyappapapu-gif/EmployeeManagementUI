import { Routes } from '@angular/router';
import { EmployeeManagerComponent } from './employees/employees.component';


export const routes: Routes = [
  { path: '', redirectTo: 'employees', pathMatch: 'full' },
  { path: 'employees', component: EmployeeManagerComponent },
  { path: '**', redirectTo: 'employees' }
];
