import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@jira-prt/platform/authentication';
import { ButtonComponent } from '@jira-prt/shared/ui';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent],
  template: `
    <div
      class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
    >
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-xl shadow-lg mb-4"
        >
          K
        </div>
        <h2
          class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Create your Kite account
        </h2>
        <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Start managing projects, issues, sprints and releases
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          class="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800 sm:px-10"
        >
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            @if (errorMessage()) {
              <div
                class="p-2.5 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-xs"
              >
                {{ errorMessage() }}
              </div>
            }

            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >Full Name</label
              >
              <input
                type="text"
                [(ngModel)]="fullName"
                name="fullName"
                required
                placeholder="Jane Doe"
                class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >Email address</label
              >
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                placeholder="name@company.com"
                class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >Password</label
              >
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="Minimum 6 characters"
                class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <app-button
              type="submit"
              variant="primary"
              [loading]="isLoading()"
              [disabled]="!fullName || !email || !password"
              class="w-full"
            >
              Sign Up
            </app-button>
          </form>

          <div class="mt-6 text-center text-xs text-slate-500">
            Already have an account?
            <a
              routerLink="/login"
              class="font-semibold text-blue-600 hover:text-blue-500 ml-1"
            >
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  async onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.auth.signUp(this.email, this.password, this.fullName);
      await this.router.navigate(['/workspaces']);
    } catch (err: unknown) {
      this.isLoading.set(false);
      this.errorMessage.set(
        (err as { message?: string }).message || 'Registration failed',
      );
    }
  }
}
