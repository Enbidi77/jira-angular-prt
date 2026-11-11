import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside
      class="h-[calc(100vh-3.5rem)] border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col justify-between transition-all duration-200 select-none z-20 shrink-0"
      [class.w-60]="!collapsed()"
      [class.w-16]="collapsed()"
    >
      <!-- Navigation Links -->
      <div class="p-3 space-y-1">
        <!-- Project Title Header in Sidebar -->
        @if (!collapsed() && projectName()) {
          <div class="px-2 py-2 mb-2">
            <span
              class="text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >Planning</span
            >
          </div>
        }

        <!-- Kanban Board -->
        <a
          [routerLink]="['/project', projectId(), 'board']"
          routerLinkActive="bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold"
          class="flex items-center px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          [title]="collapsed() ? 'Board' : ''"
        >
          <svg
            class="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
          @if (!collapsed()) {
            <span class="ml-3 truncate">Kanban Board</span>
          }
        </a>

        <!-- Backlog & Sprints -->
        <a
          [routerLink]="['/project', projectId(), 'backlog']"
          routerLinkActive="bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold"
          class="flex items-center px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          [title]="collapsed() ? 'Backlog & Sprints' : ''"
        >
          <svg
            class="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          @if (!collapsed()) {
            <span class="ml-3 truncate">Backlog & Sprints</span>
          }
        </a>

        <!-- Issues List & Filters -->
        <a
          [routerLink]="['/project', projectId(), 'issues']"
          routerLinkActive="bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold"
          class="flex items-center px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          [title]="collapsed() ? 'All Issues' : ''"
        >
          <svg
            class="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          @if (!collapsed()) {
            <span class="ml-3 truncate">All Issues</span>
          }
        </a>

        <!-- Reports & Analytics -->
        <a
          [routerLink]="['/project', projectId(), 'reports']"
          routerLinkActive="bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold"
          class="flex items-center px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          [title]="collapsed() ? 'Reports' : ''"
        >
          <svg
            class="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          @if (!collapsed()) {
            <span class="ml-3 truncate">Reports & Velocity</span>
          }
        </a>

        <!-- Project Settings -->
        <a
          [routerLink]="['/project', projectId(), 'settings']"
          routerLinkActive="bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold"
          class="flex items-center px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          [title]="collapsed() ? 'Settings' : ''"
        >
          <svg
            class="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          @if (!collapsed()) {
            <span class="ml-3 truncate">Project Settings</span>
          }
        </a>
      </div>

      <!-- Bottom Collapse Toggle -->
      <div class="p-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          (click)="collapsed.set(!collapsed())"
          class="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          [title]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <svg
            class="w-4 h-4 transition-transform duration-200"
            [class.rotate-180]="collapsed()"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  projectId = input<string>('b0000000-0000-0000-0000-000000000001');
  projectName = input<string>('Cloud Platform');
  collapsed = signal<boolean>(false);
}
