import { Component, signal, inject, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IssueRepository, Issue } from '@jira-prt/domain/issues';
import { ProjectRepository, IssueStatus } from '@jira-prt/domain/projects';
import { BadgeComponent, AvatarComponent } from '@jira-prt/shared/ui';
import { IssueDetailDrawerComponent } from '@jira-prt/domain/issues';

@Component({
  selector: 'app-issues-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BadgeComponent,
    AvatarComponent,
    IssueDetailDrawerComponent,
  ],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-4">
      <!-- Header & Filters -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4"
      >
        <div>
          <h1 class="text-xl font-bold text-slate-900 dark:text-slate-100">
            All Issues
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Filter, search, and inspect project work items
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Text search -->
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="applyFilters()"
            placeholder="Search issues..."
            class="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 px-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <!-- Priority filter -->
          <select
            [(ngModel)]="selectedPriority"
            (ngModelChange)="applyFilters()"
            class="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 px-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="highest">Highest</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="lowest">Lowest</option>
          </select>

          <!-- Status filter -->
          <select
            [(ngModel)]="selectedStatusId"
            (ngModelChange)="applyFilters()"
            class="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 px-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            @for (st of statuses(); track st.id) {
              <option [value]="st.id">{{ st.name }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Issues Data Table -->
      @if (isLoading()) {
        <div class="py-16 text-center text-xs text-slate-400">
          Loading issues...
        </div>
      } @else {
        <div
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <div class="overflow-x-auto">
            <table
              class="w-full text-left text-xs text-slate-600 dark:text-slate-300"
            >
              <thead
                class="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-[10px] text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800"
              >
                <tr>
                  <th class="py-3 px-4">Key</th>
                  <th class="py-3 px-4">Summary</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Priority</th>
                  <th class="py-3 px-4">Points</th>
                  <th class="py-3 px-4">Assignee</th>
                  <th class="py-3 px-4">Created</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (issue of filteredIssues(); track issue.id) {
                  <tr
                    (click)="selectedIssue.set(issue)"
                    class="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td
                      class="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap"
                    >
                      {{ issue.issue_key }}
                    </td>
                    <td
                      class="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-md truncate"
                    >
                      {{ issue.summary }}
                    </td>
                    <td class="py-3 px-4 whitespace-nowrap">
                      <app-badge
                        [variant]="
                          issue.status?.category === 'done'
                            ? 'done'
                            : issue.status?.category === 'in_progress'
                              ? 'progress'
                              : 'todo'
                        "
                      >
                        {{ issue.status?.name || 'Status' }}
                      </app-badge>
                    </td>
                    <td
                      class="py-3 px-4 capitalize whitespace-nowrap font-medium"
                    >
                      {{ issue.priority }}
                    </td>
                    <td class="py-3 px-4 whitespace-nowrap font-bold">
                      {{ issue.story_points ?? '-' }}
                    </td>
                    <td class="py-3 px-4 whitespace-nowrap">
                      <div class="flex items-center space-x-2">
                        <app-avatar
                          [name]="issue.assignee?.full_name || 'Unassigned'"
                          size="sm"
                        ></app-avatar>
                        <span class="truncate max-w-[120px]">{{
                          issue.assignee?.full_name || 'Unassigned'
                        }}</span>
                      </div>
                    </td>
                    <td
                      class="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]"
                    >
                      {{ issue.created_at | date: 'mediumDate' }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="py-8 text-center text-slate-400">
                      No issues match the selected criteria
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Issue Detail Drawer -->
      <app-issue-detail-drawer
        [issue]="selectedIssue()"
        (close)="selectedIssue.set(null)"
        (updated)="loadData()"
      ></app-issue-detail-drawer>
    </div>
  `,
})
export class IssuesListComponent implements OnInit {
  projectId = input<string>('b0000000-0000-0000-0000-000000000001');

  private issueRepo = inject(IssueRepository);
  private projectRepo = inject(ProjectRepository);

  allIssues = signal<Issue[]>([]);
  filteredIssues = signal<Issue[]>([]);
  statuses = signal<IssueStatus[]>([]);
  isLoading = signal<boolean>(true);

  searchQuery = '';
  selectedPriority = 'all';
  selectedStatusId = 'all';

  selectedIssue = signal<Issue | null>(null);

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    const pid = this.projectId();
    try {
      const stList = await this.projectRepo.getProjectStatuses(pid);
      this.statuses.set(stList);

      const list = await this.issueRepo.getIssuesByProject(pid);
      this.allIssues.set(list);
      this.applyFilters();
    } catch {
      // Mock / fallback
    } finally {
      this.isLoading.set(false);
    }
  }

  applyFilters() {
    let result = this.allIssues();

    if (this.selectedPriority !== 'all') {
      result = result.filter((i) => i.priority === this.selectedPriority);
    }

    if (this.selectedStatusId !== 'all') {
      result = result.filter((i) => i.status_id === this.selectedStatusId);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.issue_key.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q)),
      );
    }

    this.filteredIssues.set(result);
  }
}
