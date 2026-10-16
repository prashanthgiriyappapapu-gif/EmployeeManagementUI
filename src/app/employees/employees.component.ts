import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService } from '../services/employee.service';
import { Employee } from '../models/employee';
import { Department } from '../models/department';

@Component({
  selector: 'app-employee-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})
export class EmployeeManagerComponent implements OnInit {
  employees: Employee[] = [];
  departments: Department[] = [];
  employeeForm!: FormGroup;
  
  isEditMode = false;
  currentEmployeeId?: number;
  searchQuery = '';
  
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDepartments();
    this.loadEmployees();
  }

  initForm(): void {
    this.employeeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      salary: [null, [Validators.required, Validators.min(0.01)]],
      departmentId: ['', Validators.required]
    });
  }

  loadDepartments(): void {
    this.employeeService.getDepartments().subscribe({
      next: (data) => this.departments = data,
      error: () => this.showFeedback('Error loading departments.', true)
    });
  }

  loadEmployees(search?: string): void {
    this.employeeService.getEmployees(search).subscribe({
      next: (data) => this.employees = data,
      error: () => this.showFeedback('Error fetching employee records.', true)
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery = value;
    this.loadEmployees(value);
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const employeeData: Employee = {
      name: this.employeeForm.value.name,
      email: this.employeeForm.value.email,
      salary: Number(this.employeeForm.value.salary),
      departmentId: Number(this.employeeForm.value.departmentId)
    };

    if (this.isEditMode && this.currentEmployeeId) {
      employeeData.id = this.currentEmployeeId;
      this.employeeService.updateEmployee(this.currentEmployeeId, employeeData).subscribe({
        next: () => {
          this.showFeedback('Employee updated successfully.');
          this.resetFormState();
          this.loadEmployees(this.searchQuery);
        },
        error: (err) => this.handleApiError(err, 'Failed to update employee.')
      });
    } else {
      this.employeeService.addEmployee(employeeData).subscribe({
        next: () => {
          this.showFeedback('Employee added successfully.');
          this.resetFormState();
          this.loadEmployees(this.searchQuery);
        },
        error: (err) => this.handleApiError(err, 'Failed to add employee.')
      });
    }
  }

  onEdit(employee: Employee): void {
    this.isEditMode = true;
    this.currentEmployeeId = employee.id;
    this.employeeForm.patchValue({
      name: employee.name,
      email: employee.email,
      salary: employee.salary,
      departmentId: employee.departmentId
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDelete(id: number | undefined): void {
    if (!id) return;
    
    if (confirm('Are you absolutely sure you want to delete this employee record?')) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          this.showFeedback('Employee record removed successfully.');
          this.loadEmployees(this.searchQuery);
          if (this.currentEmployeeId === id) this.resetFormState();
        },
        error: () => this.showFeedback('Failed to delete employee record.', true)
      });
    }
  }

  resetFormState(): void {
    this.isEditMode = false;
    this.currentEmployeeId = undefined;
    this.employeeForm.reset({
      name: '',
      email: '',
      salary: null,
      departmentId: ''
    });
  }

  private showFeedback(message: string, isError = false): void {
    if (isError) {
      this.errorMessage = message;
      this.successMessage = '';
    } else {
      this.successMessage = message;
      this.errorMessage = '';
    }
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 5000);
  }

  private handleApiError(error: any, fallbackMessage: string): void {
    if (error.error && typeof error.error === 'object') {
      const messages = Object.values(error.error).flat().join(' ');
      this.showFeedback(messages || fallbackMessage, true);
    } else {
      this.showFeedback(fallbackMessage, true);
    }
  }
}
