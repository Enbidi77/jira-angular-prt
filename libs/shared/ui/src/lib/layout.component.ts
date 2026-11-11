import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterModule,
  Router,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { TopbarComponent } from './topbar.component';
import { SidebarComponent } from './sidebar.component';
import {
  IssueCreateModalComponent,
  IssueDetailDrawerComponent,
  Issue,
} from '@jira-prt/domain/issues';
import { ProjectRepository, Project } from '@jira-prt/domain/projects';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TopbarComponent,
    SidebarComponent,
    IssueCreateModalComponent,
    IssueDetailDrawerComponent,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <!-- Topbar -->
      <app-topbar
        [currentProjectName]="currentProject()?.name || 'Cloud Platform'"
        [currentProjectKey]="currentProject()?.key || 'CORE'"
        (createIssueClick)="showCreateModal.set(true)"
      ></app-topbar>

      <div class="flex-1 flex overflow-hidden">
        <!-- Collapsible Sidebar -->
        <app-sidebar
          [projectId]="currentProjectId()"
          [projectName]="currentProject()?.name || 'Cloud Platform'"
        ></app-sidebar>

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Global Create Issue Modal -->
      <app-issue-create-modal
        [isOpen]="showCreateModal()"
        [defaultProjectId]="currentProjectId()"
        (close)="showCreateModal.set(false)"
        (created)="onIssueCreated()"
      ></app-issue-create-modal>

      <!-- Global Issue Detail Drawer -->
      <app-issue-detail-drawer
        [issue]="selectedIssue()"
        (close)="selectedIssue.set(null)"
        (updated)="onIssueUpdated()"
      ></app-issue-detail-drawer>
    </div>
  `,
})
export class LayoutComponent {
  private projectRepo = inject(ProjectRepository);
  private router = inject(Router);

  currentProjectId = signal<string>('b0000000-0000-0000-0000-000000000001');
  currentProject = signal<Project | null>(null);

  showCreateModal = signal<boolean>(false);
  selectedIssue = signal<Issue | null>(null);

  constructor() {
    this.loadProjectDetails(this.currentProjectId());

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Extract project ID from URL if present
        const match = window.location.pathname.match(/\/project\/([^/]+)/);
        if (match && match[1] && match[1] !== this.currentProjectId()) {
          this.currentProjectId.set(match[1]);
          this.loadProjectDetails(match[1]);
        }
      });
  }

  async loadProjectDetails(projectId: string) {
    try {
      const p = await this.projectRepo.getProjectById(projectId);
      if (p) {
        this.currentProject.set(p);
      }
    } catch {
      // Mock / fallback
    }
  }

  onIssueCreated() {
    // Notify window or reload trigger
    window.dispatchEvent(new CustomEvent('issue-changed'));
  }

  onIssueUpdated() {
    window.dispatchEvent(new CustomEvent('issue-changed'));
  }
}
