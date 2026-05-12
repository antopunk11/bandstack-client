// src/app/features/auth/login/login.component.ts
import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule }        from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule, FormBuilder,
  Validators, AbstractControl,
} from '@angular/forms';
import { AuthService }         from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {

  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly route       = inject(ActivatedRoute);

  readonly isLoading    = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly sessionExpiredMsg = signal<string | null>(null);
  readonly year = new Date().getFullYear();

  readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    // Redirigir si ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }

    // Mostrar aviso si la sesión expiró
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'session_expired') {
      this.sessionExpiredMsg.set('Tu sesión ha expirado. Inicia sesión de nuevo.');
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService
      .login({ email: email!, password: password! })
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err: Error) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        },
      });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  // Helpers de validación para el template
  field(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  hasError(name: string, error: string): boolean {
    const ctrl = this.field(name);
    return ctrl.hasError(error) && (ctrl.dirty || ctrl.touched);
  }
}
