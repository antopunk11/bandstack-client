import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { BandService } from '../../core/services/band.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  public authService = inject(AuthService);
  private bandService = inject(BandService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  users: any[] = [];
  bands: any[] = [];
  isLoading = true;
  
  userForm: FormGroup;
  isEditing = false;
  showForm = false;
  isSubmitting = false;
  toastMessage: string | null = null;

  constructor() {
    this.userForm = this.fb.group({
      id: [null],
      band_id: [null],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''], // Requerido solo al crear
      role: ['member', Validators.required],
      is_active: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    if (this.authService.hasRole('superadmin')) {
      this.loadBands();
    }
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users = res.data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando usuarios', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadBands(): void {
    this.bandService.getBands().subscribe({
      next: (res) => {
        this.bands = res.data || [];
      },
      error: (err) => console.error('Error cargando bandas', err)
    });
  }

  openCreateForm(): void {
    this.isEditing = false;
    this.userForm.reset({ role: 'member', is_active: 1, band_id: this.authService.user$()?.band_id || 1 });
    this.userForm.get('password')?.setValidators([Validators.required]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showForm = true;
  }

  openEditForm(user: any): void {
    this.isEditing = true;
    this.userForm.patchValue({
      id: user.id,
      band_id: user.band_id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;
    
    this.isSubmitting = true;
    const data = this.userForm.value;
    
    const request = this.isEditing 
      ? this.userService.updateUser(data) 
      : this.userService.createUser(data);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showForm = false;
        this.loadUsers();
        this.showToast(this.isEditing ? 'Usuario actualizado' : 'Usuario creado');
      },
      error: (err) => {
        this.isSubmitting = false;
        alert(err.error?.message || 'Error al guardar el usuario.');
      }
    });
  }

  deleteUser(user: any): void {
    const currentUser = this.authService.user$();
    if (currentUser && currentUser.id === user.id) {
      alert('Acción bloqueada: No puedes eliminar tu propia cuenta por seguridad.');
      return;
    }

    if (confirm(`¿Seguro que quieres eliminar a ${user.name}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.showToast('Usuario eliminado');
          this.cdr.detectChanges();
        },
        error: (err) => alert(err.error?.message || 'Error al eliminar.')
      });
    }
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 3000);
  }
}