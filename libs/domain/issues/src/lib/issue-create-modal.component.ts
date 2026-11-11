import {
  Component,
  input,
  output,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { ModalComponent, ButtonComponent } from '@jira-prt/shared/ui';
import { IssueRepository, IssueType } from './issue.repository';
import { ProjectRepository, Project } from '@jira-prt/domain/projects';
import { SprintRepository, Sprint } from '@jira-prt/domain/sprints';
import {
  WorkspaceRepository,
  WorkspaceMember,
} from '@jira-prt/domain/workspaces';

@Component({
  selector: 'app-issue-create-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalComponent,
    ButtonComponent,
  ],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      title="Create Issue"
      size="lg"
      (close)="close.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Project & Issue Type Selection -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Project <span class="text-red-500">*</span>
            </label>
            <select
              formControlName="projectId"
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              @for (proj of projects(); track proj.id) {
                <option [value]="proj.id">
                  {{ proj.name }} ({{ proj.key }})
                </option>
              }
            </select>
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Issue Type <span class="text-red-500">*</span>
            </label>
            <select
              formControlName="typeId"
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              @for (t of issueTypes(); track t.id) {
                <option [value]="t.id">{{ t.name }}</option>
              }
            </select>
          </div>
        </div>

        <!-- Summary -->
        <div>
          <label
            class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Summary <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            formControlName="summary"
            placeholder="e.g. Implement webhook retry mechanism"
            class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <!-- Description -->
        <div>
          <label
            class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Description
          </label>
          <textarea
            formControlName="description"
            rows="4"
            placeholder="Describe the context, acceptance criteria, or steps to reproduce..."
            class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          ></textarea>
        </div>

        <!-- Priority & Story Points & Sprint -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Priority
            </label>
            <select
              formControlName="priority"
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="lowest">Lowest</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="highest">Highest</option>
            </select>
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Story Points
            </label>
            <input
              type="number"
              min="0"
              step="1"
              formControlName="storyPoints"
              placeholder="e.g. 3"
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Sprint
            </label>
            <select
              formControlName="sprintId"
              class="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option [ngValue]="null">Backlog (No Sprint)</option>
              @for (s of sprints(); track s.id) {
                <option [value]="s.id">{{ s.name }} ({{ s.status }})</option>
              }
            </select>
          </div>
        </div>

        <!-- Error Message -->
        @if (errorMessage()) {
          <div
            class="p-2 text-xs rounded bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
          >
            {{ errorMessage() }}
          </div>
        }

        <!-- Actions -->
        <div
          class="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800"
        >
          <app-button type="button" variant="ghost" (clicked)="close.emit()">
            Cancel
          </app-button>
          <app-button
            type="submit"
            variant="primary"
            [loading]="isSubmitting()"
            [disabled]="form.invalid"
          >
            Create
          </app-button>
        </div>
      </form>
    </app-modal>
  `,
})
export class IssueCreateModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private issueRepo = inject(IssueRepository);
  private projectRepo = inject(ProjectRepository);
  private sprintRepo = inject(SprintRepository);

  isOpen = input<boolean>(false);
  defaultProjectId = input<string>('');
  close = output<void>();
  created = output<void>();

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  projects = signal<Project[]>([]);
  issueTypes = signal<IssueType[]>([]);
  sprints = signal<Sprint[]>([]);

  form = this.fb.group({
    projectId: ['', Validators.required],
    typeId: ['', Validators.required],
    summary: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    priority: ['medium'],
    storyPoints: [null as number | null],
    sprintId: [null as string | null],
  });

  async ngOnInit() {
    await this.loadInitialData();
  }

  async loadInitialData() {
    try {
      const types = await this.issueRepo.getIssueTypes();
      this.issueTypes.set(types);

      if (types.length > 0) {
        this.form.patchValue({ typeId: types[0].id });
      }

      const pId =
        this.defaultProjectId() || 'b0000000-0000-0000-0000-000000000001';
      this.form.patchValue({ projectId: pId });

      const sprints = await this.sprintRepo.getSprintsByProject(pId);
      this.sprints.set(sprints);
    } catch {
      // Mock / fallback
    }
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.form.value;
    try {
      await this.issueRepo.createIssue({
        projectId: val.projectId!,
        typeId: val.typeId!,
        summary: val.summary!,
        description: val.description || undefined,
        priority: (val.priority as 'medium') || 'medium',
        sprintId: val.sprintId || null,
        storyPoints: val.storyPoints || null,
      });

      this.form.patchValue({
        summary: '',
        description: '',
        storyPoints: null,
      });
      this.isSubmitting.set(false);
      this.created.emit();
      this.close.emit();
    } catch (err: unknown) {
      this.isSubmitting.set(false);
      this.errorMessage.set(
        (err as { message?: string }).message || 'Failed to create issue',
      );
    }
  }
}
