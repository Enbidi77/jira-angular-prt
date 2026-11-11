import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@jira-prt/platform/authentication';
import { NotificationsService } from '@jira-prt/platform/notifications';
import { AvatarComponent } from './avatar.component';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarComponent, ButtonComponent],
  template: `
    <header class="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between select-none z-30 sticky top-0">
      <!-- Left: Logo & Context Switcher -->
      <div class="flex items-center space-x-4">
        <a routerLink="/workspaces" class="flex items-center space-x-2 text-blue-600 font-bold text-lg tracking-tight">
          <div class="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-black shadow-sm">
            K
          </div>
          <span class="text-slate-900 dark:text-slate-100 font-semibold text-base">Kite</span>
        </a>

        @if (currentProjectName()) {
          <div class="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <span>/</span>
            <span class="text-slate-800 dark:text-slate-200 font-semibold">{{ currentProjectName() }}</span>
            <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
              {{ currentProjectKey() }}
            </span>
          </div>
        }
      </div>

      <!-- Center: Global Search -->
      <div class="flex-1 max-w-md mx-4 hidden md:block">
        <div class="relative">
          <input
            type="text"
            placeholder="Search issues, projects (Press / to focus)"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            class="w-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-lg pl-8 pr-3 py-1.5 border-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400"
          />
          <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>

      <!-- Right: Actions, Notifications, Theme, Profile -->
      <div class="flex items-center space-x-3">
        <!-- Create Issue Button -->
        <app-button size="sm" variant="primary" (clicked)="createIssueClick.emit()">
          <span class="flex items-center space-x-1">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Create</span>
          </span>
        </app-button>

        <!-- Notifications -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleNotifications()"
            class="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 relative transition-colors"
            title="Notifications"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            @if (notificationService.unreadCount() > 0) {
              <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900"></span>
            }
          </button>

          <!-- Notifications Dropdown -->
          @if (showNotifications()) {
            <div class="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span class="font-semibold text-xs text-slate-800 dark:text-slate-200">Notifications</span>
                @if (notificationService.unreadCount() > 0) {
                  <button (click)="notificationService.markAllAsRead()" class="text-[11px] text-blue-600 hover:underline">
                    Mark all read
                  </button>
                }
              </div>
              <div class="mt-2 max-h-64 overflow-y-auto space-y-2">
                @for (item of notificationService.notifications(); track item.id) {
                  <div
                    (click)="notificationService.markAsRead(item.id)"
                    class="p-2 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                    [class.bg-blue-50]="!item.is_read"
                    [class.dark:bg-blue-950/40]="!item.is_read"
                  >
                    <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.title }}</div>
                    <div class="text-slate-500 text-[11px] truncate mt-0.5">{{ item.body }}</div>
                  </div>
                } @empty {
                  <div class="text-center py-6 text-slate-400 text-xs">No notifications yet</div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Theme Toggle -->
        <button
          type="button"
          (click)="toggleTheme()"
          class="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          @if (isDark()) {
            <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          } @else {
            <svg class="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          }
        </button>

        <!-- Profile Menu -->
        <div class="relative">
          <button (click)="toggleProfileMenu()" class="flex items-center space-x-2 focus:outline-none">
            <app-avatar [name]="auth.profile()?.full_name || 'User'" size="sm"></app-avatar>
          </button>

          @if (showProfileMenu()) {
            <div class="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50">
              <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                <div class="font-semibold text-slate-800 dark:text-slate-200">{{ auth.profile()?.full_name }}</div>
                <div class="text-slate-400 text-[11px] truncate">{{ auth.profile()?.email }}</div>
              </div>
              <button
                (click)="auth.signOut()"
                class="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Sign out
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  auth = inject(AuthService);
  notificationService = inject(NotificationsService);
  router = inject(Router);

  currentProjectName = input<string>('');
  currentProjectKey = input<string>('');
  searchQuery = input<string>('');
  searchChange = output<string>();
  createIssueClick = output<void>();

  showNotifications = signal(false);
  showProfileMenu = signal(false);
  isDark = signal(false);

  constructor() {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        this.setDark(true);
      }
    }
  }

  toggleTheme() {
    this.setDark(!this.isDark());
  }

  private setDark(dark: boolean) {
    this.isDark.set(dark);
    if (typeof document !== 'undefined') {
      if (dark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }

  toggleNotifications() {
    this.showNotifications.update((v) => !v);
    this.showProfileMenu.set(false);
  }

  toggleProfileMenu() {
    this.showProfileMenu.update((v) => !v);
    this.showNotifications.set(false);
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchChange.emit(val);
  }
}
