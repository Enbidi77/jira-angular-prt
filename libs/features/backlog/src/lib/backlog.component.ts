import { Component, signal, inject, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { IssueRepository, Issue } from '@jira-prt/domain/issues';
import { SprintRepository, Sprint } from '@jira-prt/domain/sprints';
import { ProjectRepository, Project } from '@jira-prt/domain/projects';
import {
  BadgeComponent,
  AvatarComponent,
  ButtonComponent,
  ModalComponent,
} from '@jira-prt/shared/ui';
import { IssueDetailDrawerComponent } from '@jira-prt/domain/issues';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    BadgeComponent,
    AvatarComponent,
    ButtonComponent,
    ModalComponent,
    IssueDetailDrawerComponent,
  ],
  template: `
    <div class="p-6 max-w-6xl mx-auto space-y-6">
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4"
      >
        <div>
          <h1 class="text-xl font-bold text-slate-900 dark:text-slate-100">
            Backlog & Sprints
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Plan sprints, estimate effort, and prioritize work
          </p>
        </div>

        <app-button
          variant="primary"
          size="sm"
          (clicked)="showCreateSprintModal.set(true)"
        >
          + Create Sprint
        </app-button>
      </div>

      <!-- Sprints Section -->
      @if (isLoading()) {
        <div class="py-16 text-center text-xs text-slate-400">
          Loading backlog and sprints...
        </div>
      } @else {
        <div cdkDropListGroup class="space-y-6">
          <!-- Active / Planned Sprints -->
          @for (sprint of sprints(); track sprint.id) {
            <div
              class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3"
            >
              <!-- Sprint Header -->
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <span
                    class="font-bold text-sm text-slate-900 dark:text-slate-100"
                    >{{ sprint.name }}</span
                  >
                  <span class="text-xs text-slate-500">
                    ({{ getSprintIssues(sprint.id).length }} issues ·
                    {{ getSprintPoints(sprint.id) }} pts)
                  </span>
                  <app-badge
                    [variant]="
                      sprint.status === 'active' ? 'progress' : 'default'
                    "
                  >
                    {{ sprint.status }}
                  </app-badge>
                </div>

                <div class="flex items-center space-x-2">
                  @if (sprint.status === 'planned') {
                    <app-button
                      size="sm"
                      variant="secondary"
                      (clicked)="onStartSprint(sprint.id)"
                    >
                      Start Sprint
                    </app-button>
                  } @else if (sprint.status === 'active') {
                    <app-button
                      size="sm"
                      variant="outline"
                      (clicked)="onCompleteSprint(sprint.id)"
                    >
                      Complete Sprint
                    </app-button>
                  }
                </div>
              </div>

              @if (sprint.goal) {
                <p class="text-xs text-slate-500 italic">{{ sprint.goal }}</p>
              }

              <!-- Sprint Drop List -->
              <div
                cdkDropList
                [id]="sprint.id"
                [cdkDropListData]="getSprintIssues(sprint.id)"
                (cdkDropListDropped)="onDrop($event, sprint.id)"
                class="min-h-[4rem] bg-slate-50/60 dark:bg-slate-800/30 rounded-lg p-2 space-y-1.5 border border-slate-200/60 dark:border-slate-800/60"
              >
                @for (issue of getSprintIssues(sprint.id); track issue.id) {
                  <div
                    cdkDrag
                    (click)="selectedIssue.set(issue)"
                    class="p-2.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all text-xs"
                  >
                    <div class="flex items-center space-x-3">
                      <span
                        class="font-mono font-semibold text-slate-500 dark:text-slate-400"
                        >{{ issue.issue_key }}</span
                      >
                      <span
                        class="font-medium text-slate-800 dark:text-slate-200"
                        >{{ issue.summary }}</span
                      >
                    </div>

                    <div class="flex items-center space-x-3">
                      @if (issue.story_points !== null) {
                        <span
                          class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300"
                        >
                          {{ issue.story_points }}
                        </span>
                      }
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
                      <app-avatar
                        [name]="issue.assignee?.full_name || 'Unassigned'"
                        size="sm"
                      ></app-avatar>
                    </div>
                  </div>
                } @empty {
                  <div class="py-4 text-center text-xs text-slate-400">
                    Plan this sprint by dragging issues here from the backlog
                  </div>
                }
              </div>
            </div>
          }

          <!-- Product Backlog Section -->
          <div
            class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span
                  class="font-bold text-sm text-slate-900 dark:text-slate-100"
                  >Backlog</span
                >
                <span class="text-xs text-slate-500">
                  ({{ getBacklogIssues().length }} issues)
                </span>
              </div>
            </div>

            <!-- Backlog Drop List -->
            <div
              cdkDropList
              id="backlog"
              [cdkDropListData]="getBacklogIssues()"
              (cdkDropListDropped)="onDrop($event, null)"
              class="min-h-[5rem] bg-slate-50/60 dark:bg-slate-800/30 rounded-lg p-2 space-y-1.5 border border-slate-200/60 dark:border-slate-800/60"
            >
              @for (issue of getBacklogIssues(); track issue.id) {
                <div
                  cdkDrag
                  (click)="selectedIssue.set(issue)"
                  class="p-2.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all text-xs"
                >
                  <div class="flex items-center space-x-3">
                    <span
                      class="font-mono font-semibold text-slate-500 dark:text-slate-400"
                      >{{ issue.issue_key }}</span
                    >
                    <span
                      class="font-medium text-slate-800 dark:text-slate-200"
                      >{{ issue.summary }}</span
                    >
                  </div>

                  <div class="flex items-center space-x-3">
                    @if (issue.story_points !== null) {
                      <span
                        class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300"
                      >
                        {{ issue.story_points }}
                      </span>
                    }
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
                    <app-avatar
                      [name]="issue.assignee?.full_name || 'Unassigned'"
                      size="sm"
                    ></app-avatar>
                  </div>
                </div>
              } @empty {
                <div class="py-6 text-center text-xs text-slate-400">
                  No issues in the backlog. Click "+ Create" in top bar to add
                  one!
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Create Sprint Modal -->
      <app-modal
        [isOpen]="showCreateSprintModal()"
        title="Create Sprint"
        (close)="showCreateSprintModal.set(false)"
      >
        <div class="space-y-4 text-xs">
          <div>
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Sprint Name</label
            >
            <input
              type="text"
              [(ngModel)]="newSprintName"
              placeholder="e.g. Sprint 2"
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label
              class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Sprint Goal</label
            >
            <textarea
              [(ngModel)]="newSprintGoal"
              rows="3"
              placeholder="What are we aiming to achieve in this sprint?"
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>
          <div class="flex justify-end space-x-2 pt-4">
            <app-button
              variant="ghost"
              (clicked)="showCreateSprintModal.set(false)"
              >Cancel</app-button
            >
            <app-button
              variant="primary"
              [disabled]="!newSprintName"
              (clicked)="onCreateSprint()"
              >Create Sprint</app-button
            >
          </div>
        </div>
      </app-modal>

      <!-- Issue Detail Drawer -->
      <app-issue-detail-drawer
        [issue]="selectedIssue()"
        (close)="selectedIssue.set(null)"
        (updated)="loadData()"
      ></app-issue-detail-drawer>
    </div>
  `,
})
export class BacklogComponent implements OnInit {
  projectId = input<string>('b0000000-0000-0000-0000-000000000001');

  private issueRepo = inject(IssueRepository);
  private sprintRepo = inject(SprintRepository);

  sprints = signal<Sprint[]>([]);
  issues = signal<Issue[]>([]);
  isLoading = signal<boolean>(true);

  showCreateSprintModal = signal<boolean>(false);
  newSprintName = '';
  newSprintGoal = '';

  selectedIssue = signal<Issue | null>(null);

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    const pid = this.projectId();
    try {
      const sList = await this.sprintRepo.getSprintsByProject(pid);
      this.sprints.set(sList);

      const iList = await this.issueRepo.getIssuesByProject(pid);
      this.issues.set(iList);
    } catch {
      // Mock / fallback
    } finally {
      this.isLoading.set(false);
    }
  }

  getSprintIssues(sprintId: string): Issue[] {
    return this.issues().filter((i) => i.sprint_id === sprintId);
  }

  getSprintPoints(sprintId: string): number {
    return this.getSprintIssues(sprintId).reduce(
      (acc, i) => acc + (i.story_points || 0),
      0,
    );
  }

  getBacklogIssues(): Issue[] {
    return this.issues().filter((i) => !i.sprint_id);
  }

  async onDrop(event: CdkDragDrop<Issue[]>, targetSprintId: string | null) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      const moved = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      // Persist sprint association
      try {
        await this.issueRepo.updateIssue(moved.id, {
          sprint_id: targetSprintId,
        });
        moved.sprint_id = targetSprintId;
      } catch {
        await this.loadData();
      }
    }
  }

  async onCreateSprint() {
    if (!this.newSprintName) return;
    try {
      const s = await this.sprintRepo.createSprint(
        this.projectId(),
        this.newSprintName,
        this.newSprintGoal,
      );
      this.sprints.update((list) => [...list, s]);
      this.showCreateSprintModal.set(false);
      this.newSprintName = '';
      this.newSprintGoal = '';
    } catch {
      // Error handling
    }
  }

  async onStartSprint(sprintId: string) {
    try {
      await this.sprintRepo.startSprint(sprintId);
      this.sprints.update((list) =>
        list.map((s) => (s.id === sprintId ? { ...s, status: 'active' } : s)),
      );
    } catch {
      // Error handling
    }
  }

  async onCompleteSprint(sprintId: string) {
    try {
      await this.sprintRepo.completeSprint(sprintId);
      this.sprints.update((list) =>
        list.map((s) =>
          s.id === sprintId ? { ...s, status: 'completed' } : s,
        ),
      );
    } catch {
      // Error handling
    }
  }
}
