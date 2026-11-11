import { TestBed } from '@angular/core/testing';
import { ProjectRepository } from './project.repository';
import { SupabaseClientService } from '@jira-prt/platform/supabase-client';

describe('ProjectRepository', () => {
  let repository: ProjectRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectRepository, SupabaseClientService],
    });
    repository = TestBed.inject(ProjectRepository);
  });

  it('should be created', () => {
    expect(repository).toBeTruthy();
  });

  it('should expose methods to manage projects, statuses, and boards', () => {
    expect(typeof repository.getProjectsByWorkspace).toBe('function');
    expect(typeof repository.createProject).toBe('function');
    expect(typeof repository.getProjectStatuses).toBe('function');
    expect(typeof repository.getProjectBoards).toBe('function');
  });
});
