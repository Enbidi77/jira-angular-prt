import { Component, signal, inject, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProjectRepository,
  Project,
  IssueStatus,
} from '@jira-prt/domain/projects';
import {
  WorkspaceRepository,
  WorkspaceMember,
} from '@jira-prt/domain/workspaces';
import { BadgeComponent, ButtonComponent } from '@jira-prt/shared/ui';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, ButtonComponent],
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-8">
      <!-- Header -->
      <div class="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 class="text-xl font-bold text-slate-900 dark:text-slate-100">
          Project Settings
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Manage project identity, workflow statuses, and team access
        </p>
      </div>

      <!-- General Info -->
      <div
        class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
      >
        <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">
          General Information
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Project Name</label
            >
            <input
              type="text"
              [(ngModel)]="projectName"
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Project Key</label
            >
            <input
              type="text"
              [value]="project()?.key"
              disabled
              class="w-full text-xs font-mono uppercase rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 p-2 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div class="sm:col-span-2">
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Description</label
            >
            <textarea
              [(ngModel)]="projectDesc"
              rows="3"
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <app-button variant="primary" size="sm" (clicked)="onSaveGeneral()">
            Save Changes
          </app-button>
        </div>
      </div>

      <!-- Configured Workflow Statuses -->
      <div
        class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
      >
        <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">
          Workflow Statuses
        </h2>
        <p class="text-xs text-slate-500">
          Statuses define the stages an issue moves through from creation to
          completion.
        </p>

        <div class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          @for (st of statuses(); track st.id) {
            <div class="py-3 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span
                  class="w-3 h-3 rounded-full"
                  [style.backgroundColor]="st.color"
                ></span>
                <span
                  class="font-semibold text-slate-800 dark:text-slate-200"
                  >{{ st.name }}</span
                >
                <app-badge
                  [variant]="
                    st.category === 'done'
                      ? 'done'
                      : st.category === 'in_progress'
                        ? 'progress'
                        : 'todo'
                  "
                >
                  {{ st.category }}
                </app-badge>
              </div>

              <span class="text-slate-400 font-mono text-[11px]"
                >Position: {{ st.position }}</span
              >
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  projectId = input<string>('b0000000-0000-0000-0000-000000000001');

  private projectRepo = inject(ProjectRepository);

  project = signal<Project | null>(null);
  statuses = signal<IssueStatus[]>([]);

  projectName = '';
  projectDesc = '';

  async ngOnInit() {
    const pid = this.projectId();
    try {
      const p = await this.projectRepo.getProjectById(pid);
      if (p) {
        this.project.set(p);
        this.projectName = p.name;
        this.projectDesc = p.description || '';
      }

      const stList = await this.projectRepo.getProjectStatuses(pid);
      this.statuses.set(stList);
    } catch {
      // Mock / fallback
    }
  }

  onSaveGeneral() {
    // Saved
  }
}
