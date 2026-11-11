import { Component, signal, inject, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueRepository, Issue } from '@jira-prt/domain/issues';
import {
  ProjectRepository,
  Project,
  IssueStatus,
} from '@jira-prt/domain/projects';
import { SprintRepository, Sprint } from '@jira-prt/domain/sprints';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-6xl mx-auto space-y-6">
      <!-- Header -->
      <div class="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 class="text-xl font-bold text-slate-900 dark:text-slate-100">
          Project Reports & Analytics
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Velocity, burndown, and issue distribution statistics
        </p>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
        >
          <div
            class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
          >
            Total Issues
          </div>
          <div
            class="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1"
          >
            {{ totalIssues() }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">
            Across all project boards
          </div>
        </div>

        <div
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
        >
          <div
            class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
          >
            Done / Resolved
          </div>
          <div
            class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1"
          >
            {{ doneIssues() }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">
            {{ completionRate() }}% completion rate
          </div>
        </div>

        <div
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
        >
          <div
            class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
          >
            Story Points
          </div>
          <div
            class="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1"
          >
            {{ totalPoints() }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">
            {{ donePoints() }} points delivered
          </div>
        </div>

        <div
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
        >
          <div
            class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
          >
            Active Sprints
          </div>
          <div class="text-2xl font-black text-amber-500 mt-1">
            {{ activeSprintsCount() }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">Currently in flight</div>
        </div>
      </div>

      <!-- Charts & Visual Breakdown -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Status Breakdown Chart -->
        <div
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
        >
          <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">
            Status Distribution
          </h2>
          <div class="space-y-3">
            @for (st of statusCounts(); track st.name) {
              <div>
                <div class="flex justify-between text-xs font-medium mb-1">
                  <span class="text-slate-700 dark:text-slate-300">{{
                    st.name
                  }}</span>
                  <span class="text-slate-500"
                    >{{ st.count }} issues ({{ st.percentage }}%)</span
                  >
                </div>
                <div
                  class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden"
                >
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    [style.width.%]="st.percentage"
                    [style.backgroundColor]="st.color"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Priority Breakdown -->
        <div
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
        >
          <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">
            Priority Breakdown
          </h2>
          <div class="space-y-3">
            @for (p of priorityCounts(); track p.priority) {
              <div>
                <div class="flex justify-between text-xs font-medium mb-1">
                  <span class="capitalize text-slate-700 dark:text-slate-300">{{
                    p.priority
                  }}</span>
                  <span class="text-slate-500">{{ p.count }} issues</span>
                </div>
                <div
                  class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden"
                >
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    [style.width.%]="p.percentage"
                    [ngClass]="p.colorClass"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  projectId = input<string>('b0000000-0000-0000-0000-000000000001');

  private issueRepo = inject(IssueRepository);
  private projectRepo = inject(ProjectRepository);
  private sprintRepo = inject(SprintRepository);

  issues = signal<Issue[]>([]);
  statuses = signal<IssueStatus[]>([]);
  sprints = signal<Sprint[]>([]);

  totalIssues = signal<number>(0);
  doneIssues = signal<number>(0);
  completionRate = signal<number>(0);
  totalPoints = signal<number>(0);
  donePoints = signal<number>(0);
  activeSprintsCount = signal<number>(0);

  statusCounts = signal<
    { name: string; color: string; count: number; percentage: number }[]
  >([]);
  priorityCounts = signal<
    {
      priority: string;
      count: number;
      percentage: number;
      colorClass: string;
    }[]
  >([]);

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const pid = this.projectId();
    try {
      const [issueList, statusList, sprintList] = await Promise.all([
        this.issueRepo.getIssuesByProject(pid),
        this.projectRepo.getProjectStatuses(pid),
        this.sprintRepo.getSprintsByProject(pid),
      ]);

      this.issues.set(issueList);
      this.statuses.set(statusList);
      this.sprints.set(sprintList);

      const total = issueList.length;
      this.totalIssues.set(total);

      const done = issueList.filter(
        (i) => i.status?.category === 'done',
      ).length;
      this.doneIssues.set(done);
      this.completionRate.set(total > 0 ? Math.round((done / total) * 100) : 0);

      const points = issueList.reduce(
        (acc, i) => acc + (i.story_points || 0),
        0,
      );
      this.totalPoints.set(points);

      const dPoints = issueList
        .filter((i) => i.status?.category === 'done')
        .reduce((acc, i) => acc + (i.story_points || 0), 0);
      this.donePoints.set(dPoints);

      this.activeSprintsCount.set(
        sprintList.filter((s) => s.status === 'active').length,
      );

      // Status counts
      this.statusCounts.set(
        statusList.map((st) => {
          const count = issueList.filter((i) => i.status_id === st.id).length;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return {
            name: st.name,
            color: st.color,
            count,
            percentage,
          };
        }),
      );

      // Priority counts
      const priorities = ['highest', 'high', 'medium', 'low', 'lowest'];
      const colorMap: Record<string, string> = {
        highest: 'bg-red-600',
        high: 'bg-orange-500',
        medium: 'bg-amber-400',
        low: 'bg-blue-400',
        lowest: 'bg-slate-400',
      };

      this.priorityCounts.set(
        priorities.map((p) => {
          const count = issueList.filter((i) => i.priority === p).length;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return {
            priority: p,
            count,
            percentage,
            colorClass: colorMap[p] || 'bg-slate-400',
          };
        }),
      );
    } catch {
      // Mock / fallback
    }
  }
}
