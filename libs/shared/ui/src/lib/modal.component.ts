import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          (click)="close.emit()"
        ></div>

        <!-- Dialog Box -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full rounded-xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all"
            [ngClass]="maxWidthClass()"
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800"
            >
              <h3
                class="text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                {{ title() }}
              </h3>
              <button
                type="button"
                class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                (click)="close.emit()"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="mt-4">
              <ng-content></ng-content>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('');
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  close = output<void>();

  maxWidthClass() {
    switch (this.size()) {
      case 'sm':
        return 'max-w-md';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      default:
        return 'max-w-lg';
    }
  }
}
