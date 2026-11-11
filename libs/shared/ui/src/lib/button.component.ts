import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      (click)="onClick($event)"
      class="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
      [ngClass]="[sizeClasses(), variantClasses()]"
    >
      @if (loading()) {
        <svg
          class="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      }
      <ng-content></ng-content>
    </button>
  `,
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'>(
    'primary',
  );
  size = input<'sm' | 'md' | 'lg'>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  clicked = output<MouseEvent>();

  onClick(event: MouseEvent) {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }

  sizeClasses() {
    switch (this.size()) {
      case 'sm':
        return 'px-2.5 py-1.5 text-xs';
      case 'lg':
        return 'px-5 py-2.5 text-base';
      default:
        return 'px-3.5 py-2 text-sm';
    }
  }

  variantClasses() {
    switch (this.variant()) {
      case 'secondary':
        return 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700';
      case 'outline':
        return 'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800';
      case 'ghost':
        return 'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm';
    }
  }
}
