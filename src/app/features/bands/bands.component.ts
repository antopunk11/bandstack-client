import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BandService } from '../../core/services/band.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-bands',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bands.component.html'
})
export class BandsComponent implements OnInit {
  private bandService = inject(BandService);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  bands: any[] = [];
  isLoading = true;
  
  bandForm: FormGroup;
  isEditing = false;
  showForm = false;
  isSubmitting = false;
  toastMessage: string | null = null;

  constructor() {
    this.bandForm = this.fb.group({
      id: [null],
      name: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadBands();
  }

  loadBands(): void {
    this.isLoading = true;
    this.bandService.getBands().subscribe({
      next: (res) => {
        this.bands = res.data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando bandas', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openCreateForm(): void {
    this.isEditing = false;
    this.bandForm.reset();
    this.showForm = true;
  }

  openEditForm(band: any): void {
    this.isEditing = true;
    this.bandForm.patchValue({ id: band.id, name: band.name });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  onSubmit(): void {
    if (this.bandForm.invalid) return;
    
    this.isSubmitting = true;
    const request = this.isEditing 
      ? this.bandService.updateBand(this.bandForm.value) 
      : this.bandService.createBand(this.bandForm.value);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showForm = false;
        this.loadBands();
        this.showToast(this.isEditing ? 'Banda actualizada correctamente' : 'Banda creada correctamente');
      },
      error: (err) => {
        this.isSubmitting = false;
        alert(err.error?.message || 'Error al guardar la banda.');
        this.cdr.detectChanges();
      }
    });
  }

  deleteBand(band: any): void {
    if (band.id === 1) {
      alert('No puedes eliminar la Banda Principal del sistema.');
      return;
    }

    if (confirm(`¿Seguro que quieres eliminar la banda "${band.name}"? Se borrarán todos sus usuarios, productos y eventos.`)) {
      this.bandService.deleteBand(band.id).subscribe({
        next: () => {
          this.bands = this.bands.filter(b => b.id !== band.id);
          this.showToast('Banda eliminada');
          this.cdr.detectChanges();
        },
        error: (err) => alert(err.error?.message || 'Error al eliminar la banda.')
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