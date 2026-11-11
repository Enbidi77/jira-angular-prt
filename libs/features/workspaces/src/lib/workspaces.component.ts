import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { WorkspaceRepository, Workspace } from '@jira-prt/domain/workspaces';
import { ProjectRepository, Project } from '@jira-prt/domain/projects';
import { AuthService } from '@jira-prt/platform/authentication';
import { ButtonComponent, ModalComponent } from '@jira-prt/shared/ui';

@Component({
  selector: 'app-workspaces',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    ModalComponent,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-10">
      <div class="max-w-6xl mx-auto space-y-8">
        <!-- Header -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6"
        >
          <div>
            <h1
              class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
            >
              Workspaces & Projects
            </h1>
            <p class="text-xs text-slate-500 mt-1">
              Select a project to jump into active boards, backlogs, and sprints
            </p>
          </div>

          <div class="flex items-center space-x-3">
            <app-button
              variant="outline"
              size="sm"
              (clicked)="showNewWsModal.set(true)"
            >
              + New Workspace
            </app-button>
            <app-button
              variant="primary"
              size="sm"
              (clicked)="showNewProjModal.set(true)"
            >
              + New Project
            </app-button>
          </div>
        </div>

        <!-- Workspaces and Projects List -->
        @if (isLoading()) {
          <div class="py-16 text-center text-slate-400 text-xs">
            Loading workspaces...
          </div>
        } @else {
          <div class="space-y-8">
            @for (ws of workspaces(); track ws.id) {
              <div
                class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
              >
                <!-- Workspace Title -->
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs"
                    >
                      {{ ws.name.substring(0, 2).toUpperCase() }}
                    </div>
                    <div>
                      <h2
                        class="text-base font-bold text-slate-900 dark:text-slate-100"
                      >
                        {{ ws.name }}
                      </h2>
                      <span class="text-[11px] text-slate-400 font-mono"
                        >/{{ ws.slug }}</span
                      >
                    </div>
                  </div>
                </div>

                <!-- Projects Grid -->
                <div
                  class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
                >
                  @for (p of getProjectsForWorkspace(ws.id); track p.id) {
                    <a
                      [routerLink]="['/project', p.id, 'board']"
                      class="group block p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div class="flex items-start justify-between">
                        <div
                          class="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-xs"
                        >
                          {{ p.key }}
                        </div>
                        <span
                          class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        >
                          {{ p.category || 'software' }}
                        </span>
                      </div>

                      <h3
                        class="mt-3 font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors"
                      >
                        {{ p.name }}
                      </h3>
                      <p class="mt-1 text-xs text-slate-500 line-clamp-2">
                        {{ p.description || 'No description provided' }}
                      </p>

                      <div
                        class="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400"
                      >
                        <span>{{ p.issue_counter }} issues total</span>
                        <span
                          class="text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform"
                        >
                          Open Board &rarr;
                        </span>
                      </div>
                    </a>
                  } @empty {
                    <div
                      class="col-span-full py-8 text-center text-xs text-slate-400"
                    >
                      No projects in this workspace yet. Click "+ New Project"
                      above.
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <div
                class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center"
              >
                <h3
                  class="text-base font-bold text-slate-800 dark:text-slate-200"
                >
                  No workspaces found
                </h3>
                <p class="text-xs text-slate-500 mt-1 mb-4">
                  Create your first workspace to start collaborating
                </p>
                <app-button
                  variant="primary"
                  (clicked)="showNewWsModal.set(true)"
                >
                  Create Workspace
                </app-button>
              </div>
            }
          </div>
        }
      </div>

      <!-- New Workspace Modal -->
      <app-modal
        [isOpen]="showNewWsModal()"
        title="Create Workspace"
        (close)="showNewWsModal.set(false)"
      >
        <div class="space-y-4 text-xs">
          <div>
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Workspace Name</label
            >
            <input
              type="text"
              [(ngModel)]="newWsName"
              placeholder="e.g. Acme Corp"
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >URL Slug</label
            >
            <input
              type="text"
              [(ngModel)]="newWsSlug"
              placeholder="e.g. acme-corp"
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div class="flex justify-end space-x-2 pt-4">
            <app-button variant="ghost" (clicked)="showNewWsModal.set(false)"
              >Cancel</app-button
            >
            <app-button
              variant="primary"
              [disabled]="!newWsName"
              (clicked)="onCreateWorkspace()"
              >Create</app-button
            >
          </div>
        </div>
      </app-modal>

      <!-- New Project Modal -->
      <app-modal
        [isOpen]="showNewProjModal()"
        title="Create Project"
        (close)="showNewProjModal.set(false)"
      >
        <div class="space-y-4 text-xs">
          <div>
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Target Workspace</label
            >
            <select
              [(ngModel)]="newProjWsId"
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              @for (ws of workspaces(); track ws.id) {
                <option [value]="ws.id">{{ ws.name }}</option>
              }
            </select>
          </div>
          <div>
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Project Name</label
            >
            <input
              type="text"
              [(ngModel)]="newProjName"
              placeholder="e.g. Mobile Application"
              (input)="onProjNameChange()"
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Project Key (Prefix)</label
            >
            <input
              type="text"
              [(ngModel)]="newProjKey"
              maxlength="10"
              placeholder="e.g. MOB"
              class="w-full text-xs uppercase font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Description</label
            >
            <textarea
              [(ngModel)]="newProjDesc"
              rows="3"
              placeholder="Project purpose and objectives..."
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>
          <div class="flex justify-end space-x-2 pt-4">
            <app-button variant="ghost" (clicked)="showNewProjModal.set(false)"
              >Cancel</app-button
            >
            <app-button
              variant="primary"
              [disabled]="!newProjName || !newProjKey"
              (clicked)="onCreateProject()"
              >Create Project</app-button
            >
          </div>
        </div>
      </app-modal>
    </div>
  `,
})
export class WorkspacesComponent implements OnInit {
  private wsRepo = inject(WorkspaceRepository);
  private projectRepo = inject(ProjectRepository);
  private router = inject(Router);

  workspaces = signal<Workspace[]>([]);
  projects = signal<Project[]>([]);
  isLoading = signal<boolean>(true);

  showNewWsModal = signal<boolean>(false);
  newWsName = '';
  newWsSlug = '';

  showNewProjModal = signal<boolean>(false);
  newProjWsId = '';
  newProjName = '';
  newProjKey = '';
  newProjDesc = '';

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const wsList = await this.wsRepo.getMyWorkspaces();
      this.workspaces.set(wsList);

      if (wsList.length > 0) {
        this.newProjWsId = wsList[0].id;
        const allProjects: Project[] = [];
        for (const ws of wsList) {
          const projs = await this.projectRepo.getProjectsByWorkspace(ws.id);
          allProjects.push(...projs);
        }
        this.projects.set(allProjects);
      }
    } catch {
      // Mock / fallback
    } finally {
      this.isLoading.set(false);
    }
  }

  getProjectsForWorkspace(wsId: string): Project[] {
    return this.projects().filter((p) => p.workspace_id === wsId);
  }

  onProjNameChange() {
    if (!this.newProjKey && this.newProjName) {
      this.newProjKey = this.newProjName
        .replace(/[^a-zA-Z]/g, '')
        .substring(0, 4)
        .toUpperCase();
    }
  }

  async onCreateWorkspace() {
    if (!this.newWsName) return;
    try {
      const slug =
        this.newWsSlug ||
        this.newWsName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const ws = await this.wsRepo.createWorkspace(this.newWsName, slug);
      this.workspaces.update((list) => [...list, ws]);
      this.showNewWsModal.set(false);
      this.newWsName = '';
      this.newWsSlug = '';
    } catch {
      // Error handling
    }
  }

  async onCreateProject() {
    if (!this.newProjName || !this.newProjKey || !this.newProjWsId) return;
    try {
      const p = await this.projectRepo.createProject(
        this.newProjWsId,
        this.newProjName,
        this.newProjKey,
        this.newProjDesc,
      );
      this.projects.update((list) => [...list, p]);
      this.showNewProjModal.set(false);
      this.newProjName = '';
      this.newProjKey = '';
      this.newProjDesc = '';
      await this.router.navigate(['/project', p.id, 'board']);
    } catch {
      // Error handling
    }
  }
}
