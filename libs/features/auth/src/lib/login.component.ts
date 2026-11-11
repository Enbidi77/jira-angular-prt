import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@jira-prt/platform/authentication';
import { ButtonComponent } from '@jira-prt/shared/ui';

@Component({
  selector: 'app-login',
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
          Sign in to Kite
        </h2>
        <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
          The agile project management platform for modern engineering teams
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          class="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800 sm:px-10"
        >
          <!-- Demo Login Banner -->
          <div
            class="mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-xs"
          >
            <div class="font-semibold text-blue-900 dark:text-blue-200 mb-1">
              Instant Demo Access
            </div>
            <p class="text-blue-700 dark:text-blue-300 mb-2">
              Explore all features with a pre-configured engineering workspace.
            </p>
            <app-button
              size="sm"
              variant="secondary"
              [loading]="isDemoLoading()"
              (clicked)="onDemoLogin()"
            >
              Continue as Demo Engineer
            </app-button>
          </div>

          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center">
              <div
                class="w-full border-t border-slate-200 dark:border-slate-800"
              ></div>
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-white dark:bg-slate-900 px-2 text-slate-400"
                >Or with email</span
              >
            </div>
          </div>

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
                placeholder="••••••••"
                class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <app-button
              type="submit"
              variant="primary"
              [loading]="isLoading()"
              [disabled]="!email || !password"
              class="w-full"
            >
              Sign In
            </app-button>
          </form>

          <div class="mt-6 text-center text-xs text-slate-500">
            Don't have an account?
            <a
              routerLink="/register"
              class="font-semibold text-blue-600 hover:text-blue-500 ml-1"
            >
              Create account
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  isLoading = signal(false);
  isDemoLoading = signal(false);
  errorMessage = signal<string | null>(null);

  async onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.auth.signIn(this.email, this.password);
      await this.router.navigate(['/workspaces']);
    } catch (err: unknown) {
      this.isLoading.set(false);
      this.errorMessage.set(
        (err as { message?: string }).message || 'Invalid credentials',
      );
    }
  }

  async onDemoLogin() {
    this.isDemoLoading.set(true);
    this.errorMessage.set(null);

    try {
      // In local dev try signing in with demo credentials, or fallback mock session
      try {
        await this.auth.signIn('demo@acme.com', 'demopassword123');
      } catch {
        // Fallback demo mock profile
        this.auth.profile.set({
          id: '00000000-0000-0000-0000-000000000001',
          email: 'demo@acme.com',
          full_name: 'Alex Rivera (Staff Engineer)',
          avatar_url: null,
          job_title: 'Staff Architect',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      this.isDemoLoading.set(false);
      await this.router.navigate(['/workspaces']);
    } catch {
      this.isDemoLoading.set(false);
      await this.router.navigate(['/workspaces']);
    }
  }
}
