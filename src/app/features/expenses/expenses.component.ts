import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ExpenseService } from '../../core/services/expense.service';
import { EventService } from '../../core/services/event.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.models';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expenses.component.html'
})
export class ExpensesComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  expenses: any[] = [];
  filteredExpenses: any[] = [];
  currentFilter: 'all' | 'pending' | 'paid' = 'all';

  events: any[] = [];
  isLoading = true;

  showCreateForm = false;
  expenseForm: FormGroup;
  isSubmitting = false;
  editingExpenseId: number | null = null;
  currentUser: User | null = null;
  selectedFile: File | null = null;

  toastMessage: string | null = null;

  categories = ['Dieta', 'Gasolina', 'Peaje', 'Alojamiento', 'Promo', 'Alquiler', 'Otros'];

  constructor() {
    this.currentUser = this.authService.user$();
    this.expenseForm = this.fb.group({
      category: ['Gasolina', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      expense_date: [new Date().toISOString().split('T')[0], Validators.required],
      event_id: [''], // Opcional
      description: [''],
      is_paid: [0]
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
          this.applyFilter();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.isLoading = false; this.cdr.detectChanges(); }
      });
    });
  }

  applyFilter(): void {
    if (this.currentFilter === 'paid') {
      this.filteredExpenses = this.expenses.filter(e => e.is_paid);
    } else if (this.currentFilter === 'pending') {
      this.filteredExpenses = this.expenses.filter(e => !e.is_paid);
    } else {
      this.filteredExpenses = [...this.expenses];
    }
  }

  setFilter(filter: 'all' | 'pending' | 'paid'): void {
    this.currentFilter = filter;
    this.applyFilter();
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.expenseForm.reset({ category: 'Gasolina', expense_date: new Date().toISOString().split('T')[0], is_paid: 0 });
      this.editingExpenseId = null;
      this.selectedFile = null;
    }
  }

  openEditForm(expense: any): void {
    this.editingExpenseId = expense.id;
    this.expenseForm.patchValue({
      category: expense.category,
      amount: expense.amount,
      expense_date: expense.expense_date,
      event_id: expense.event_id || '',
      description: expense.description || '',
      is_paid: expense.is_paid ? 1 : 0
    });
    this.selectedFile = null; // No editamos archivos subidos por el momento
    this.showCreateForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload = this.expenseForm.value;

    if (this.editingExpenseId) {
      let updatePayload: any = payload;
      
      if (this.selectedFile) {
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
          if (payload[key] !== null && payload[key] !== undefined && payload[key] !== '') {
            formData.append(key, payload[key]);
          }
        });
        formData.append('receipt_file', this.selectedFile);
        updatePayload = formData;
      }

      this.expenseService.updateExpense(this.editingExpenseId, updatePayload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showToast('Gasto actualizado correctamente');
          this.toggleCreateForm();
          this.loadData();
        },
        error: (err) => { 
          this.isSubmitting = false; 
          alert(err.error?.message || 'Error al actualizar el gasto.'); 
        }
      });
    } else {
      let createPayload: any = payload;
      
      if (this.selectedFile) {
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
          if (payload[key] !== null && payload[key] !== undefined && payload[key] !== '') {
            formData.append(key, payload[key]);
          }
        });
        formData.append('receipt_file', this.selectedFile);
        createPayload = formData;
      }

      this.expenseService.createExpense(createPayload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showToast('Gasto registrado correctamente');
          this.toggleCreateForm();
          this.loadData();
        },
        error: (err) => { 
          this.isSubmitting = false; 
          alert(err.error?.message || 'Error al registrar el gasto.'); 
        }
      });
    }
  }

  togglePaymentStatus(expense: any): void {
    const newStatus = expense.is_paid ? 0 : 1;
    
    this.expenseService.updateExpense(expense.id, { is_paid: newStatus }).subscribe({
      next: () => {
        expense.is_paid = newStatus;
        this.showToast(newStatus ? 'Gasto marcado como pagado' : 'Gasto marcado como pendiente');
        this.applyFilter(); // Aplicamos el filtro de nuevo para sacarlo de la vista si es necesario
        this.cdr.detectChanges(); // Forzamos la actualización de la vista
      },
      error: (err) => alert(err.error?.message || 'Error al actualizar el estado de pago.')
    });
  }

  deleteExpense(expense: any): void {
    if (confirm(`¿Estás seguro de que deseas eliminar este gasto de ${expense.amount}€?`)) {
      this.expenseService.deleteExpense(expense.id).subscribe({
        next: () => {
          this.expenses = this.expenses.filter(e => e.id !== expense.id);
          this.applyFilter();
          this.showToast('Gasto eliminado correctamente');
        },
        error: (err) => alert(err.error?.message || 'Error al eliminar el gasto.')
      });
    }
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.detectChanges();
    setTimeout(() => { this.toastMessage = null; this.cdr.detectChanges(); }, 3000);
  }

  canEdit(expense: any): boolean {
    if (!this.currentUser) {
      return false;
    }

    // Admins y Superadmins siempre pueden editar
    if (this.currentUser.role === 'admin' || this.currentUser.role === 'superadmin') {
      return true;
    }

    // Los miembros solo pueden editar los gastos que han creado
    return this.currentUser.id === expense.created_by;
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'Dieta': 'text-emerald-400',
      'Gasolina': 'text-amber-400',
      'Peaje': 'text-blue-400',
      'Alojamiento': 'text-indigo-400',
      'Promo': 'text-fuchsia-400',
      'Alquiler': 'text-rose-400',
      'Otros': 'text-zinc-400'
    };
    return colors[category] || 'text-zinc-400';
  }
}