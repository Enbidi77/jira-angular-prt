import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wide"
      [ngClass]="classes()"
      [style.backgroundColor]="bgColor()"
      [style.color]="textColor()"
    >
      <ng-content></ng-content>
    </span>
  `,
})
export class BadgeComponent {
  variant = input<
    'default' | 'todo' | 'progress' | 'done' | 'priority-high' | 'priority-low'
  >('default');
  bgColor = input<string | null>(null);
  textColor = input<string | null>(null);

  classes() {
    switch (this.variant()) {
      case 'todo':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'progress':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'done':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'priority-high':
        return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300';
      case 'priority-low':
        return 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  }
}
