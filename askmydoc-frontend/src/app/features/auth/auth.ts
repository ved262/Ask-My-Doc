import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatInputModule } from '@angular/material/input';

@Component({
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  selector: 'app-auth',
  styleUrl: './auth.scss',
  templateUrl: './auth.html',
})
export class Auth {
  private auth = inject(AuthService);
  private router = inject(Router);

  mode = signal<'login' | 'register'>('login');
  isLoading = signal(false);
  errorMessage = signal('');

  email = '';
  password = '';

  toggleMode(): void {
    this.mode.update(m => (m === 'login' ? 'register' : 'login'));
    this.errorMessage.set('');
  }

  submit(): void {
    const email = this.email.trim();

    if (!email || !this.password) {
      this.errorMessage.set('Email and password are required');
      return;
    }
    if (this.mode() === 'register' && this.password.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const request$ = this.mode() === 'login'
      ? this.auth.login(email, this.password)
      : this.auth.register(email, this.password);

    request$.subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Something went wrong. Please try again.');
      }
    });
  }
}
