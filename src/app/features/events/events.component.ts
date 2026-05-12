import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EventService } from '../../core/services/event.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './events.component.html'
})
export class EventsComponent implements OnInit {
  private eventService = inject(EventService);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  events: any[] = [];
  isLoading = true;

  // Variables del formulario
  showCreateForm = false;
  eventForm: FormGroup;
  isSubmitting = false;
  editingEventId: number | null = null;

  // Toast
  toastMessage: string | null = null;
  private toastTimeout: any;

  constructor() {
    this.eventForm = this.fb.group({
      name: ['', Validators.required],
      event_date: ['', Validators.required],
      type: ['concert', Validators.required],
      venue: [''],
      cache_amount: [0, Validators.min(0)]
    });
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.eventService.getEvents().subscribe({
      next: (res) => {
        this.events = res.data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando eventos', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.editingEventId = null;
      this.eventForm.reset({ type: 'concert' }); // Valores por defecto al cerrar
    }
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    
    if (this.editingEventId) {
      this.eventService.updateEvent(this.editingEventId, this.eventForm.value).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          const index = this.events.findIndex(e => e.id === this.editingEventId);
          if (index !== -1) this.events[index] = res.data;
          this.toggleCreateForm();
          this.showToast('Evento actualizado con éxito');
        },
        error: (err) => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.eventService.createEvent(this.eventForm.value).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.events.unshift(res.data);
          this.toggleCreateForm();
          this.showToast('¡Evento creado con éxito!');
        },
        error: (err) => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  editEvent(event: any): void {
    this.editingEventId = event.id;
    this.eventForm.patchValue(event);
    this.showCreateForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteEvent(event: any): void {
    if (confirm(`¿Estás seguro de que quieres eliminar el evento "${event.name}"?`)) {
      this.eventService.deleteEvent(event.id).subscribe({
        next: () => {
          this.events = this.events.filter(e => e.id !== event.id);
          this.showToast('Evento eliminado');
        },
        error: (err) => alert(err.error?.message || 'Error al eliminar el evento.')
      });
    }
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.detectChanges();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 3000);
  }
}