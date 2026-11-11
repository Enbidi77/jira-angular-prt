import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { SupabaseClientService } from '@jira-prt/platform/supabase-client';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, SupabaseClientService],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with loading or non-authenticated state', () => {
    expect(service.user()).toBeDefined();
    expect(service.profile()).toBeDefined();
  });
});
