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
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

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
    this.selectedFile = null;
    this.previewUrl = null;
    this.bandForm.reset();
    this.showForm = true;
  }

  openEditForm(band: any): void {
    this.isEditing = true;
    this.selectedFile = null;
    this.previewUrl = band.logo_url || null;
    this.bandForm.patchValue({ id: band.id, name: band.name });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = e => this.previewUrl = reader.result;
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.bandForm.invalid) return;
    
    this.isSubmitting = true;
    
    const formData = new FormData();
    if (this.isEditing) {
      formData.append('id', this.bandForm.value.id);
    }
    formData.append('name', this.bandForm.value.name);
    if (this.selectedFile) {
      formData.append('logo_file', this.selectedFile);
    }

    const request = this.isEditing 
      ? this.bandService.updateBand(formData as any) 
      : this.bandService.createBand(formData as any);

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