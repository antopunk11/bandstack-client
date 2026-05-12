import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ExpenseService } from '../../core/services/expense.service';
import { EventService } from '../../core/services/event.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expenses.component.html'
})
export class ExpensesComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private eventService = inject(EventService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  expenses: any[] = [];
  events: any[] = [];
  isLoading = true;

  showCreateForm = false;
  expenseForm: FormGroup;
  isSubmitting = false;

  toastMessage: string | null = null;

  categories = ['Dieta', 'Gasolina', 'Peaje', 'Alojamiento', 'Promo', 'Alquiler', 'Otros'];

  constructor() {
    this.expenseForm = this.fb.group({
      category: ['Gasolina', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      expense_date: [new Date().toISOString().split('T')[0], Validators.required],
      event_id: [''], // Opcional
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    // Cargar Eventos para el select
    this.eventService.getEvents().subscribe(res => {
      this.events = res.data || [];
      
      // Cargar Gastos
      this.expenseService.getExpenses().subscribe({
        next: (expRes) => {
          this.expenses = expRes.data || [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.isLoading = false; this.cdr.detectChanges(); }
      });
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.expenseForm.reset({ category: 'Gasolina', expense_date: new Date().toISOString().split('T')[0] });
    }
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.expenseService.createExpense(this.expenseForm.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showToast('Gasto registrado correctamente');
        this.toggleCreateForm();
        this.loadData(); // Recargamos la tabla
      },
      error: (err) => { this.isSubmitting = false; alert('Error al registrar el gasto.'); }
    });
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.detectChanges();
    setTimeout(() => { this.toastMessage = null; this.cdr.detectChanges(); }, 3000);
  }
}