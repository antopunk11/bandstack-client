// src/app/app.routes.ts
import { Routes }   from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  // ── Rutas públicas ────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Acceder — BandStack',
  },

  // ── Rutas protegidas (cualquier usuario autenticado) ──────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard — BandStack',
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory.component').then(m => m.InventoryComponent),
        title: 'Inventario — BandStack',
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./features/events/events.component').then(m => m.EventsComponent),
        title: 'Eventos — BandStack',
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./features/pos/pos.component').then(m => m.PosComponent),
        title: 'Terminal de Ventas — BandStack',
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/expenses/expenses.component').then(m => m.ExpensesComponent),
        title: 'Gastos — BandStack',
      },

      // ── Solo Admin ──────────────────────────────────────────── 
      {
        path: 'products/new',
        // Carga perezosa (Lazy loading) del componente Standalone
        loadComponent: () => import('./features/products/product-create/product-create.component').then(m => m.ProductCreateComponent),
        canActivate: [roleGuard],
        data: { 
          roles: ['admin'] // Protegemos la ruta: solo los administradores pueden crear productos
        }
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadComponent: () =>
          import('./features/users/users.component').then(m => m.UsersComponent),
        title: 'Usuarios — BandStack',
      },
      {
        path: 'settings',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadComponent: () =>
          import('./features/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Ajustes — BandStack',
      },

      // ── Solo SuperAdmin (SaaS Plataforma) ───────────────────── 
      {
        path: 'bands',
        canActivate: [roleGuard],
        data: { roles: ['superadmin'] },
        loadComponent: () =>
          import('./features/bands/bands.component').then(m => m.BandsComponent),
        title: 'Plataforma SaaS — BandStack',
      },
    ],
  },

  // ── Acceso denegado ───────────────────────────────────────────
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./shared/pages/forbidden/forbidden.component').then(m => m.ForbiddenComponent),
    title: 'Sin permisos — BandStack',
  },

  // ── Catch-all 404 ─────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./shared/pages/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Página no encontrada — BandStack',
  },
];
