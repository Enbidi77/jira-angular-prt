import {
  Component,
  input,
  output,
  signal,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BadgeComponent,
  AvatarComponent,
  ButtonComponent,
} from '@jira-prt/shared/ui';
import { IssueRepository, Issue, Comment } from './issue.repository';
import { ProjectRepository, IssueStatus } from '@jira-prt/domain/projects';

@Component({
  selector: 'app-issue-detail-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BadgeComponent,
    AvatarComponent,
    ButtonComponent,
  ],
  template: `
    @if (issue()) {
      <div class="fixed inset-0 z-50 overflow-hidden">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          (click)="close.emit()"
        ></div>

        <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div
            class="w-screen max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
          >
            <!-- Header -->
            <div
              class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
            >
              <div class="flex items-center space-x-3">
                <span
                  class="font-mono text-sm font-bold text-blue-600 dark:text-blue-400"
                >
                  {{ issue()?.issue_key }}
                </span>
                <app-badge
                  [variant]="
                    issue()?.status?.category === 'done'
                      ? 'done'
                      : issue()?.status?.category === 'in_progress'
                        ? 'progress'
                        : 'todo'
                  "
                >
                  {{ issue()?.status?.name || 'Status' }}
                </app-badge>
              </div>

              <button
                type="button"
                (click)="close.emit()"
                class="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

            <!-- Body Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              <!-- Summary Title -->
              <div>
                <h2
                  class="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug"
                >
                  {{ issue()?.summary }}
                </h2>
              </div>

              <!-- Main Grid: Details & Attributes -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <!-- Left Details: Description & Comments -->
                <div class="sm:col-span-2 space-y-6">
                  <!-- Description -->
                  <div>
                    <h3
                      class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2"
                    >
                      Description
                    </h3>
                    <div
                      class="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 min-h-[5rem]"
                    >
                      {{ issue()?.description || 'No description provided.' }}
                    </div>
                  </div>

                  <!-- Comments Section -->
                  <div
                    class="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800"
                  >
                    <h3
                      class="text-xs font-bold uppercase tracking-wider text-slate-400"
                    >
                      Activity & Comments
                    </h3>

                    <!-- Comment Input -->
                    <div class="space-y-2">
                      <textarea
                        [(ngModel)]="newCommentText"
                        rows="2"
                        placeholder="Add a comment..."
                        class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      ></textarea>
                      <div class="flex justify-end">
                        <app-button
                          size="sm"
                          variant="primary"
                          [loading]="isAddingComment()"
                          [disabled]="!newCommentText.trim()"
                          (clicked)="onAddComment()"
                        >
                          Save Comment
                        </app-button>
                      </div>
                    </div>

                    <!-- Comments List -->
                    <div class="space-y-3">
                      @for (c of comments(); track c.id) {
                        <div
                          class="flex space-x-3 text-xs bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800"
                        >
                          <app-avatar
                            [name]="c.author?.full_name || 'User'"
                            size="sm"
                          ></app-avatar>
                          <div class="flex-1 space-y-1">
                            <div class="flex items-center justify-between">
                              <span
                                class="font-semibold text-slate-800 dark:text-slate-200"
                                >{{ c.author?.full_name || 'Member' }}</span
                              >
                              <span class="text-[10px] text-slate-400">{{
                                c.created_at | date: 'short'
                              }}</span>
                            </div>
                            <p
                              class="text-slate-700 dark:text-slate-300 leading-normal"
                            >
                              {{ c.content }}
                            </p>
                          </div>
                        </div>
                      } @empty {
                        <div class="text-center py-4 text-xs text-slate-400">
                          No comments yet
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <!-- Right Attributes Sidebar -->
                <div
                  class="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 self-start text-xs"
                >
                  <!-- Status Transition -->
                  <div>
                    <label
                      class="block font-semibold text-slate-500 mb-1 text-[11px] uppercase"
                      >Status</label
                    >
                    <select
                      [ngModel]="issue()?.status_id"
                      (ngModelChange)="onStatusChange($event)"
                      class="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 font-medium text-slate-800 dark:text-slate-200"
                    >
                      @for (s of statuses(); track s.id) {
                        <option [value]="s.id">{{ s.name }}</option>
                      }
                    </select>
                  </div>

                  <!-- Priority -->
                  <div>
                    <label
                      class="block font-semibold text-slate-500 mb-1 text-[11px] uppercase"
                      >Priority</label
                    >
                    <span
                      class="capitalize font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {{ issue()?.priority }}
                    </span>
                  </div>

                  <!-- Assignee -->
                  <div>
                    <label
                      class="block font-semibold text-slate-500 mb-1 text-[11px] uppercase"
                      >Assignee</label
                    >
                    <div class="flex items-center space-x-2">
                      <app-avatar
                        [name]="issue()?.assignee?.full_name || 'Unassigned'"
                        size="sm"
                      ></app-avatar>
                      <span class="text-slate-800 dark:text-slate-200">
                        {{ issue()?.assignee?.full_name || 'Unassigned' }}
                      </span>
                    </div>
                  </div>

                  <!-- Reporter -->
                  <div>
                    <label
                      class="block font-semibold text-slate-500 mb-1 text-[11px] uppercase"
                      >Reporter</label
                    >
                    <div class="flex items-center space-x-2">
                      <app-avatar
                        [name]="issue()?.reporter?.full_name || 'Reporter'"
                        size="sm"
                      ></app-avatar>
                      <span class="text-slate-800 dark:text-slate-200">
                        {{ issue()?.reporter?.full_name || 'Reporter' }}
                      </span>
                    </div>
                  </div>

                  <!-- Story Points -->
                  @if (issue()?.story_points !== null) {
                    <div>
                      <label
                        class="block font-semibold text-slate-500 mb-1 text-[11px] uppercase"
                        >Story Points</label
                      >
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold"
                      >
                        {{ issue()?.story_points }} pts
                      </span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class IssueDetailDrawerComponent {
  private issueRepo = inject(IssueRepository);
  private projectRepo = inject(ProjectRepository);

  issue = input<Issue | null>(null);
  close = output<void>();
  updated = output<void>();

  statuses = signal<IssueStatus[]>([]);
  comments = signal<Comment[]>([]);
  newCommentText = '';
  isAddingComment = signal<boolean>(false);

  constructor() {
    effect(async () => {
      const current = this.issue();
      if (current) {
        // Load statuses for project
        const stList = await this.projectRepo.getProjectStatuses(
          current.project_id,
        );
        this.statuses.set(stList);

        // Load comments
        const commList = await this.issueRepo.getComments(current.id);
        this.comments.set(commList);
      }
    });
  }

  async onStatusChange(newStatusId: string) {
    const cur = this.issue();
    if (!cur || cur.status_id === newStatusId) return;

    try {
      await this.issueRepo.transitionIssue(cur.id, newStatusId);
      this.updated.emit();
    } catch {
      // Transition failed
    }
  }

  async onAddComment() {
    const cur = this.issue();
    if (!cur || !this.newCommentText.trim()) return;

    this.isAddingComment.set(true);
    try {
      const c = await this.issueRepo.addComment(
        cur.id,
        this.newCommentText.trim(),
      );
      this.comments.update((list) => [...list, c]);
      this.newCommentText = '';
      this.isAddingComment.set(false);
      this.updated.emit();
    } catch {
      this.isAddingComment.set(false);
    }
  }
}
