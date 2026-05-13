import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private cdr = inject(ChangeDetectorRef);
  public authService = inject(AuthService);

  isLoading = false; // Empezamos en false por si entra sin evento
  currentUser: any = null;
  event: any = null;
  summary: any = null;
  isClosing = false;
  
  errorMessage: string | null = null;
  totalRevenue = 0;
  totalExpenses = 0;
  netProfit = 0;
  pendingCache = 0;

  ngOnInit(): void {
    this.currentUser = this.authService.user$();

    this.route.queryParams.subscribe(params => {
      if (params['event_id']) {
        this.loadDashboard(+params['event_id']);
      } else {
        this.loadGlobalDashboard();
      }
    });
  }

  loadDashboard(eventId: number): void {
    this.isLoading = true;
    this.eventService.getEventSummary(eventId).subscribe({
      next: (res) => {
        this.event = res.data.event;
        this.summary = res.data.summary;
        this.errorMessage = null;
        
        // Verificamos si el evento es futuro para separar el caché pendiente
        const eventDate = new Date(this.event.event_date);
        const isFuture = eventDate > new Date();
        
        const cacheAmount = Number(this.event.cache_amount || 0);
        this.pendingCache = isFuture ? cacheAmount : 0;
        const collectedCache = isFuture ? 0 : cacheAmount;

        // Calculamos el gran total sumando las ventas de merch y el caché cobrado del evento
        const salesTotal = this.summary.totals.reduce((acc: number, curr: any) => acc + Number(curr.total), 0);
        this.totalRevenue = salesTotal + collectedCache;

        // Calculamos los gastos y el beneficio neto real
        this.totalExpenses = Number(this.summary.expenses || 0);
        this.netProfit = this.totalRevenue - this.totalExpenses;

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar la liquidación', err);
        this.isLoading = false;
        this.errorMessage = 'Hubo un problema al cargar los datos del evento.';
        this.cdr.detectChanges();
      }
    });
  }

  loadGlobalDashboard(): void {
    this.isLoading = true;
    this.eventService.getGlobalSummary().subscribe({
      next: (res) => {
        this.event = null; // null indica que estamos en la vista global
        this.summary = res.data.summary;
        this.errorMessage = null;
        
        // Calculamos el gran total global (solo con el caché ya cobrado)
        const salesTotal = this.summary.totals.reduce((acc: number, curr: any) => acc + Number(curr.total), 0);
        this.totalRevenue = salesTotal + Number(this.summary.collected_cache || this.summary.cache || 0);

        // Asignamos el caché pendiente de cobro
        this.pendingCache = Number(this.summary.pending_cache || 0);

        // Calculamos los gastos y el beneficio neto histórico
        this.totalExpenses = Number(this.summary.expenses || 0);
        this.netProfit = this.totalRevenue - this.totalExpenses;

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar el histórico global', err);
        this.isLoading = false;
        this.errorMessage = 'Hubo un problema al cargar los datos globales.';
        this.cdr.detectChanges();
      }
    });
  }

  closeEvent(): void {
    if (!this.event || this.event.status === 'closed') return;
    
    if (confirm('¿Estás seguro de que quieres cerrar este evento? No se podrán registrar más ventas en él.')) {
      this.isClosing = true;
      this.eventService.closeEvent(this.event.id).subscribe({
        next: () => {
          this.event.status = 'closed';
          this.isClosing = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error cerrando evento', err);
          this.isClosing = false;
          this.errorMessage = 'No se pudo cerrar el evento.';
          this.cdr.detectChanges();
        }
      });
    }
  }
}