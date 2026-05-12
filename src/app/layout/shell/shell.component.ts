// src/app/layout/shell/shell.component.ts
import {
  Component, inject, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule }              from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService }               from '../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  roles?: ('admin' | 'member')[];
  icon: string; // SVG path
}

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">

      <!-- Sidebar -->
      <aside
        class="flex flex-col w-64 shrink-0 border-r border-zinc-800 bg-zinc-900
               transition-transform duration-300 ease-in-out
               fixed inset-y-0 left-0 z-40 lg:static lg:translate-x-0"
        [class.-translate-x-full]="!sidebarOpen()"
        [class.translate-x-0]="sidebarOpen()"
      >
        <!-- Logo -->
        <div class="flex items-center gap-3 px-5 py-5 border-b border-zinc-800">
          <div class="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <span class="font-mono font-bold text-sm tracking-wider text-white">BANDSTACK</span>
        </div>

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          @for (item of visibleNavItems(); track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-orange-600/15 text-orange-400 border-orange-600/40"
              [routerLinkActiveOptions]="{ exact: item.route === '/' }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-zinc-400 border border-transparent
                     hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              (click)="closeSidebar()"
            >
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path [attr.d]="item.icon"/>
              </svg>
              {{ item.label }}
            </a>
          }
        </nav>

        <!-- User info + logout -->
        <div class="border-t border-zinc-800 p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
              {{ userInitials() }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-zinc-200 truncate">{{ authService.user$()?.name }}</p>
              <p class="text-xs text-zinc-500 capitalize">{{ authService.user$()?.role }}</p>
            </div>
          </div>
          <button
            (click)="logout()"
            class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-500
                   hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- Overlay móvil -->
      @if (sidebarOpen()) {
        <div
          class="fixed inset-0 bg-black/50 z-30 lg:hidden"
          (click)="closeSidebar()"
        ></div>
      }

      <!-- Contenido principal -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

        <!-- Topbar móvil -->
        <header class="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900 lg:hidden">
          <button
            (click)="toggleSidebar()"
            class="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            aria-label="Abrir menú"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span class="font-mono font-bold text-sm text-white tracking-wider">BANDSTACK</span>
        </header>

        <!-- Router outlet -->
        <main class="flex-1 overflow-y-auto">
          <router-outlet/>
        </main>

      </div>
    </div>
  `,
})
export class ShellComponent {
  readonly authService = inject(AuthService);
  readonly sidebarOpen = signal(false);

  private readonly allNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
      label: 'Inventario',
      route: '/inventory',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    },
    {
      label: 'Eventos',
      route: '/events',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      label: 'Terminal (POS)',
      route: '/pos',
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    },
    {
      label: 'Gastos',
      route: '/expenses',
      icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
    },
    {
      label: 'Usuarios',
      route: '/users',
      roles: ['admin'],
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      label: 'Ajustes',
      route: '/settings',
      roles: ['admin'],
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    },
  ];

  readonly visibleNavItems = () => {
    const role = this.authService.user$()?.role;
    return this.allNavItems.filter(
      item => !item.roles || (role && item.roles.includes(role as 'admin' | 'member')),
    );
  };

  readonly userInitials = () => {
    const name = this.authService.user$()?.name ?? '';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }
  closeSidebar(): void  { this.sidebarOpen.set(false); }
  logout(): void        { this.authService.logout(); }
}
