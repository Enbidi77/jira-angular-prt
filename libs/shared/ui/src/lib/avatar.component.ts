import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="inline-flex items-center justify-center rounded-full font-semibold overflow-hidden select-none bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600"
      [ngClass]="sizeClasses()"
      [title]="name()"
    >
      @if (imageUrl()) {
        <img
          [src]="imageUrl()"
          [alt]="name()"
          class="w-full h-full object-cover"
        />
      } @else {
        <span>{{ initials() }}</span>
      }
    </div>
  `,
})
export class AvatarComponent {
  name = input<string>('User');
  imageUrl = input<string | null>(null);
  size = input<'sm' | 'md' | 'lg'>('md');

  initials(): string {
    const parts = (this.name() || 'U').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0][0] || 'U').toUpperCase();
  }

  sizeClasses() {
    switch (this.size()) {
      case 'sm':
        return 'w-6 h-6 text-[10px]';
      case 'lg':
        return 'w-10 h-10 text-sm';
      default:
        return 'w-8 h-8 text-xs';
    }
  }
}
