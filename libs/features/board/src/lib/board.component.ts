import {
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
  input,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { IssueRepository, Issue, IssueType } from '@jira-prt/domain/issues';
import {
  ProjectRepository,
  Project,
  BoardColumn,
  IssueStatus,
} from '@jira-prt/domain/projects';
import { RealtimeService } from '@jira-prt/platform/realtime';
import { AuthService } from '@jira-prt/platform/authentication';
import {
  BadgeComponent,
  AvatarComponent,
  ButtonComponent,
} from '@jira-prt/shared/ui';
import { IssueDetailDrawerComponent } from '@jira-prt/domain/issues';

interface ColumnWithIssues extends BoardColumn {
  issues: Issue[];
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    BadgeComponent,
    AvatarComponent,
    ButtonComponent,
    IssueDetailDrawerComponent,
  ],
  template: `
    <div class="p-6 h-full flex flex-col space-y-4">
      <!-- Board Top Bar -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="text-xl font-bold text-slate-900 dark:text-slate-100">
              {{ project()?.name || 'Project' }} Board
            </h1>
            <span
              class="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
            >
              Kanban
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Drag issues between columns to transition statuses
          </p>
        </div>

        <!-- Active Collaborators Presence -->
        <div class="flex items-center space-x-3">
          <div class="flex -space-x-1.5 overflow-hidden">
            @for (
              collab of realtime.activeCollaborators();
              track collab.userId
            ) {
              <div
                class="inline-block ring-2 ring-white dark:ring-slate-900 rounded-full"
                [title]="collab.userName + ' is viewing'"
              >
                <app-avatar [name]="collab.userName" size="sm"></app-avatar>
              </div>
            }
          </div>

          <!-- Filter Search -->
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchFilter"
              (ngModelChange)="applyFilters()"
              placeholder="Filter board..."
              class="w-48 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 pl-7 pr-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <svg
              class="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Kanban Columns Container (CDK Drop List Group) -->
      @if (isLoading()) {
        <div class="py-20 text-center text-xs text-slate-400">
          Loading board columns and issues...
        </div>
      } @else {
        <div
          cdkDropListGroup
          class="flex-1 flex space-x-4 overflow-x-auto pb-4 select-none"
        >
          @for (col of columns(); track col.id) {
            <div
              class="w-80 shrink-0 flex flex-col bg-slate-100/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-3 max-h-[calc(100vh-13rem)]"
            >
              <!-- Column Header -->
              <div class="flex items-center justify-between pb-3 px-1">
                <div class="flex items-center space-x-2">
                  <span
                    class="w-2.5 h-2.5 rounded-full"
                    [style.backgroundColor]="col.status?.color || '#94a3b8'"
                  ></span>
                  <span
                    class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    {{ col.name }}
                  </span>
                  <span
                    class="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400"
                  >
                    {{ col.issues.length }}
                  </span>
                </div>

                <!-- Quick Add Trigger -->
                <button
                  type="button"
                  (click)="toggleQuickAdd(col.id)"
                  class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="Add issue to this column"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>

              <!-- Quick Add Input Form -->
              @if (activeQuickAddColumnId() === col.id) {
                <div
                  class="mb-3 p-2.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-blue-400 dark:border-blue-500 space-y-2"
                >
                  <textarea
                    [(ngModel)]="quickAddSummary"
                    (keydown.enter)="
                      $event.preventDefault(); onQuickAddSubmit(col.status_id)
                    "
                    placeholder="What needs to be done?"
                    rows="2"
                    class="w-full text-xs bg-transparent text-slate-900 dark:text-slate-100 border-none outline-none resize-none"
                  ></textarea>
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      (click)="activeQuickAddColumnId.set(null)"
                      class="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                    >
                      Cancel
                    </button>
                    <app-button
                      size="sm"
                      variant="primary"
                      [disabled]="!quickAddSummary.trim()"
                      (clicked)="onQuickAddSubmit(col.status_id)"
                    >
                      Add
                    </app-button>
                  </div>
                </div>
              }

              <!-- Droppable Issue Cards Container -->
              <div
                cdkDropList
                [cdkDropListData]="col.issues"
                [id]="col.status_id"
                (cdkDropListDropped)="onDrop($event, col.status_id)"
                class="flex-1 overflow-y-auto space-y-2.5 min-h-[10rem] pr-1"
              >
                @for (issue of col.issues; track issue.id) {
                  <div
                    cdkDrag
                    [cdkDragData]="issue"
                    (click)="selectedIssue.set(issue)"
                    class="p-3 bg-white dark:bg-slate-800/90 rounded-lg shadow-xs hover:shadow-md border border-slate-200/90 dark:border-slate-700/60 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-all group"
                  >
                    <!-- Issue Type & Key -->
                    <div
                      class="flex items-center justify-between text-[11px] mb-1.5"
                    >
                      <span
                        class="font-mono font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 transition-colors"
                      >
                        {{ issue.issue_key }}
                      </span>
                      <app-badge
                        [variant]="
                          issue.priority === 'high' ||
                          issue.priority === 'highest'
                            ? 'priority-high'
                            : 'default'
                        "
                      >
                        {{ issue.priority }}
                      </app-badge>
                    </div>

                    <!-- Summary -->
                    <p
                      class="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug"
                    >
                      {{ issue.summary }}
                    </p>

                    <!-- Footer: Story Points & Assignee -->
                    <div
                      class="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between"
                    >
                      <div class="flex items-center space-x-1.5">
                        @if (issue.story_points !== null) {
                          <span
                            class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300"
                          >
                            {{ issue.story_points }}
                          </span>
                        }
                      </div>

                      <app-avatar
                        [name]="issue.assignee?.full_name || 'Unassigned'"
                        size="sm"
                      ></app-avatar>
                    </div>
                  </div>
                } @empty {
                  <div
                    class="h-24 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg"
                  >
                    No issues
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Issue Detail Drawer -->
      <app-issue-detail-drawer
        [issue]="selectedIssue()"
        (close)="selectedIssue.set(null)"
        (updated)="loadBoardData()"
      ></app-issue-detail-drawer>
    </div>
  `,
})
export class BoardComponent implements OnInit, OnDestroy {
  projectId = input<string>('b0000000-0000-0000-0000-000000000001');

  private issueRepo = inject(IssueRepository);
  private projectRepo = inject(ProjectRepository);
  realtime = inject(RealtimeService);
  private auth = inject(AuthService);

  project = signal<Project | null>(null);
  columns = signal<ColumnWithIssues[]>([]);
  allIssues = signal<Issue[]>([]);
  isLoading = signal<boolean>(true);

  activeQuickAddColumnId = signal<string | null>(null);
  quickAddSummary = '';
  searchFilter = '';

  selectedIssue = signal<Issue | null>(null);

  private unsubscribeRealtime?: () => void;
  private unsubscribePresence?: () => void;

  constructor() {
    effect(() => {
      const pid = this.projectId();
      if (pid) {
        this.loadBoardData();
        this.setupRealtime(pid);
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('issue-changed', () => this.loadBoardData());
    }
  }

  ngOnInit() {
    this.loadBoardData();
  }

  ngOnDestroy() {
    if (this.unsubscribeRealtime) this.unsubscribeRealtime();
    if (this.unsubscribePresence) this.unsubscribePresence();
  }

  async loadBoardData() {
    this.isLoading.set(true);
    const pid = this.projectId();
    try {
      const p = await this.projectRepo.getProjectById(pid);
      this.project.set(p);

      const boards = await this.projectRepo.getProjectBoards(pid);
      let boardCols: BoardColumn[] = [];
      if (boards.length > 0) {
        boardCols = await this.projectRepo.getBoardColumns(boards[0].id);
      }

      if (boardCols.length === 0) {
        // Fallback default 3 statuses
        const statuses = await this.projectRepo.getProjectStatuses(pid);
        boardCols = statuses.map((s, idx) => ({
          id: `col-${idx}`,
          board_id: 'default',
          status_id: s.id,
          name: s.name,
          position: s.position,
          wip_limit: null,
          status: s,
        }));
      }

      const issues = await this.issueRepo.getIssuesByProject(pid);
      this.allIssues.set(issues);

      // Group issues into columns
      const colsWithIssues: ColumnWithIssues[] = boardCols.map((c) => ({
        ...c,
        issues: issues.filter((i) => i.status_id === c.status_id),
      }));

      this.columns.set(colsWithIssues);
    } catch {
      // Mock / fallback
    } finally {
      this.isLoading.set(false);
    }
  }

  setupRealtime(projectId: string) {
    if (this.unsubscribeRealtime) this.unsubscribeRealtime();
    if (this.unsubscribePresence) this.unsubscribePresence();

    // Subscribe to project issues changes
    this.unsubscribeRealtime = this.realtime.subscribeToProjectIssues(
      projectId,
      () => {
        this.loadBoardData();
      },
    );

    // Join presence room
    const user = this.auth.user();
    const profile = this.auth.profile();
    if (user) {
      this.unsubscribePresence = this.realtime.joinPresence(
        `board-${projectId}`,
        {
          id: user.id,
          name: profile?.full_name || user.email?.split('@')[0] || 'Member',
          avatarUrl: profile?.avatar_url || undefined,
        },
      );
    }
  }

  applyFilters() {
    const q = this.searchFilter.toLowerCase().trim();
    if (!q) {
      this.columns.update((cols) =>
        cols.map((c) => ({
          ...c,
          issues: this.allIssues().filter((i) => i.status_id === c.status_id),
        })),
      );
      return;
    }

    this.columns.update((cols) =>
      cols.map((c) => ({
        ...c,
        issues: this.allIssues().filter(
          (i) =>
            i.status_id === c.status_id &&
            (i.issue_key.toLowerCase().includes(q) ||
              i.summary.toLowerCase().includes(q) ||
              (i.description && i.description.toLowerCase().includes(q))),
        ),
      })),
    );
  }

  async onDrop(event: CdkDragDrop<Issue[]>, targetStatusId: string) {
    if (event.previousContainer === event.container) {
      // Reorder within same column
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      const moved = event.container.data[event.currentIndex];
      if (moved) {
        // Update rank string
        await this.issueRepo.updateIssueRank(
          moved.id,
          `${event.currentIndex}`.padStart(6, '0'),
        );
      }
    } else {
      // Transfer to different column (status transition!)
      const issue = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      // Perform optimistic update and execute backend transition
      try {
        await this.issueRepo.transitionIssue(issue.id, targetStatusId);
        issue.status_id = targetStatusId;
      } catch {
        // Rollback on transition failure
        await this.loadBoardData();
      }
    }
  }

  toggleQuickAdd(colId: string) {
    if (this.activeQuickAddColumnId() === colId) {
      this.activeQuickAddColumnId.set(null);
    } else {
      this.activeQuickAddColumnId.set(colId);
      this.quickAddSummary = '';
    }
  }

  async onQuickAddSubmit(statusId: string) {
    if (!this.quickAddSummary.trim()) return;

    const pid = this.projectId();
    const types = await this.issueRepo.getIssueTypes();
    const typeId = types.find((t) => t.name === 'Task')?.id || types[0]?.id;

    try {
      const newIssue = await this.issueRepo.createIssue({
        projectId: pid,
        typeId,
        summary: this.quickAddSummary.trim(),
      });

      // If created with different default status, transition it to this column
      if (newIssue.status_id !== statusId) {
        await this.issueRepo.transitionIssue(newIssue.id, statusId);
      }

      this.quickAddSummary = '';
      this.activeQuickAddColumnId.set(null);
      await this.loadBoardData();
    } catch {
      // Handle error
    }
  }
}
