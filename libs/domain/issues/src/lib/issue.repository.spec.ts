import { TestBed } from '@angular/core/testing';
import { IssueRepository } from './issue.repository';
import { SupabaseClientService } from '@jira-prt/platform/supabase-client';

describe('IssueRepository', () => {
  let repository: IssueRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IssueRepository, SupabaseClientService],
    });
    repository = TestBed.inject(IssueRepository);
  });

  it('should be created', () => {
    expect(repository).toBeTruthy();
  });

  it('should expose issue querying and creation methods', () => {
    expect(typeof repository.getIssuesByProject).toBe('function');
    expect(typeof repository.createIssue).toBe('function');
    expect(typeof repository.transitionIssue).toBe('function');
    expect(typeof repository.updateIssueRank).toBe('function');
  });
});
