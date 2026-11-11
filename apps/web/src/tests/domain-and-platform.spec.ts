import { TestBed } from '@angular/core/testing';
import { AuthService } from '@jira-prt/platform/authentication';
import { SupabaseClientService } from '@jira-prt/platform/supabase-client';
import { IssueRepository } from '@jira-prt/domain/issues';
import { ProjectRepository } from '@jira-prt/domain/projects';
import { SprintRepository } from '@jira-prt/domain/sprints';
import { WorkspaceRepository } from '@jira-prt/domain/workspaces';
import { NotificationsService } from '@jira-prt/platform/notifications';
import { RealtimeService } from '@jira-prt/platform/realtime';

describe('Domain Repositories & Platform Services', () => {
  let authService: AuthService;
  let issueRepo: IssueRepository;
  let projectRepo: ProjectRepository;
  let sprintRepo: SprintRepository;
  let workspaceRepo: WorkspaceRepository;
  let notificationsService: NotificationsService;
  let realtimeService: RealtimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        IssueRepository,
        ProjectRepository,
        SprintRepository,
        WorkspaceRepository,
        NotificationsService,
        RealtimeService,
        SupabaseClientService,
      ],
    });

    authService = TestBed.inject(AuthService);
    issueRepo = TestBed.inject(IssueRepository);
    projectRepo = TestBed.inject(ProjectRepository);
    sprintRepo = TestBed.inject(SprintRepository);
    workspaceRepo = TestBed.inject(WorkspaceRepository);
    notificationsService = TestBed.inject(NotificationsService);
    realtimeService = TestBed.inject(RealtimeService);
  });

  it('should instantiate all core services successfully', () => {
    expect(authService).toBeTruthy();
    expect(issueRepo).toBeTruthy();
    expect(projectRepo).toBeTruthy();
    expect(sprintRepo).toBeTruthy();
    expect(workspaceRepo).toBeTruthy();
    expect(notificationsService).toBeTruthy();
    expect(realtimeService).toBeTruthy();
  });

  it('IssueRepository should expose transactional operations', () => {
    expect(typeof issueRepo.getIssuesByProject).toBe('function');
    expect(typeof issueRepo.createIssue).toBe('function');
    expect(typeof issueRepo.transitionIssue).toBe('function');
    expect(typeof issueRepo.updateIssueRank).toBe('function');
    expect(typeof issueRepo.getComments).toBe('function');
    expect(typeof issueRepo.addComment).toBe('function');
  });

  it('ProjectRepository should expose project and board queries', () => {
    expect(typeof projectRepo.getProjectsByWorkspace).toBe('function');
    expect(typeof projectRepo.createProject).toBe('function');
    expect(typeof projectRepo.getProjectStatuses).toBe('function');
    expect(typeof projectRepo.getProjectBoards).toBe('function');
    expect(typeof projectRepo.getBoardColumns).toBe('function');
  });

  it('SprintRepository should manage sprint lifecycle', () => {
    expect(typeof sprintRepo.getSprintsByProject).toBe('function');
    expect(typeof sprintRepo.createSprint).toBe('function');
    expect(typeof sprintRepo.startSprint).toBe('function');
    expect(typeof sprintRepo.completeSprint).toBe('function');
  });

  it('NotificationsService should compute unread count correctly', () => {
    notificationsService.notifications.set([
      {
        id: '1',
        user_id: 'u1',
        actor_id: null,
        issue_id: null,
        type: 'assigned',
        title: 'Assigned',
        body: 'You were assigned',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        user_id: 'u1',
        actor_id: null,
        issue_id: null,
        type: 'commented',
        title: 'Comment',
        body: 'New comment',
        is_read: true,
        created_at: new Date().toISOString(),
      },
    ]);

    expect(notificationsService.unreadCount()).toBe(1);
  });
});
